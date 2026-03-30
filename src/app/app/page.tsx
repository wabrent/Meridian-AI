"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft, FileText, Shield, Database, ExternalLink, History, LogOut, WifiOff } from "lucide-react";
import Link from "next/link";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { createDefaultErasureCodingProvider, generateCommitments, ShelbyBlobClient, ShelbyRPCClient, ShelbyClientConfig } from "@shelby-protocol/sdk/browser";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/components/WalletProvider";

type TabType = "upload" | "history" | "certificates";

interface UploadedFile {
  name: string;
  size: number;
  date: string;
  txHash: string;
}

export default function AppDashboard() {
  const { account, connected, connect, disconnect, wallets, signAndSubmitTransaction } = useWallet();
  const { isCorrectNetwork, currentNetwork } = useNetwork();
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "signing" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Mock history data (in real app, this would come from blockchain/indexer)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    // Demo data
    { name: "portfolio_v2.pdf", size: 2450000, date: "2024-01-15", txHash: "0x8f...3a" },
    { name: "contract_signed.docx", size: 125000, date: "2024-01-14", txHash: "0x2c...1f" },
  ]);

  const handleConnect = async () => {
    try {
      if (wallets && wallets[0]) {
        await connect(wallets[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!account || !file) return;

    try {
      // Initialize Aptos client with Shelbynet configuration
      const aptosConfig = new AptosConfig({ 
        network: Network.CUSTOM,
        fullnode: process.env.NEXT_PUBLIC_SHELBY_FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1",
        faucet: null,
      });
      const aptos = new Aptos(aptosConfig);

      setStatus("generating");
      console.log("Generating Blob Commitments via ClayErasureCodingProvider...");
      
      const provider = await createDefaultErasureCodingProvider();
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      const commitments = await generateCommitments(provider, data);
      
      setStatus("signing");
      const deployerAddress = process.env.NEXT_PUBLIC_SHELBY_CONTRACT_ADDRESS || "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";
      
      // Create payload using Aptos SDK proper format
      // Calculate expiration: current time + 1 year in microseconds
      const nowMicros = BigInt(Date.now()) * 1000n;
      const oneYearMicros = 365n * 24n * 60n * 60n * 1000n * 1000n;
      const expirationMicros = nowMicros + oneYearMicros;
      
      // Convert to hex string (browser compatible)
      const bytesToHex = (bytes: Uint8Array) => 
        Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const blobNameHex = bytesToHex(new TextEncoder().encode(file.name));
      const merkleRootHex = bytesToHex(commitments.blob_merkle_root);
      
      const payload = {
        function: `${deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [
          account.address,
          `0x${blobNameHex}`,
          `0x${data.length.toString(16)}`,
          `0x${merkleRootHex}`,
          `0x${expirationMicros.toString(16)}`,
          `0x${commitments.chunkset_commitments.length.toString(16)}`,
          `0x0`
        ]
      };

      console.log("blob_merkle_root type:", typeof commitments.blob_merkle_root);
      console.log("blob_merkle_root:", commitments.blob_merkle_root);
      console.log("merkleRootHex:", merkleRootHex);
      console.log("File size (hex):", `0x${data.length.toString(16)}`);
      console.log("Chunks (hex):", `0x${commitments.chunkset_commitments.length.toString(16)}`);
      console.log("Expiration (hex):", `0x${expirationMicros.toString(16)}`);

      console.log("Payload created, waiting for wallet signature...");
      console.log("Submitting to Shelbynet via wallet...");
      
      // Submit transaction through wallet
      const response = await signAndSubmitTransaction({ data: payload });
      
      console.log("Transaction submitted:", response.hash);
      console.log("Waiting for transaction confirmation on Shelbynet...");
      
      // Wait for transaction using Shelbynet fullnode
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setStatus("uploading");
      console.log("Blockchain registration successful. Uploading data chunks to RPC...");
      
      // Upload chunks via RPC
      const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || "https://api.shelbynet.shelby.xyz/shelby";
      const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";
      
      const uploadResponse = await fetch(`${rpcUrl}/blob/${account.address.toString()}/${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: data
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      console.log("Upload complete!");
      setStatus("success");
      
      // Add to history
      setUploadedFiles(prev => [{
        name: file.name,
        size: file.size,
        date: new Date().toISOString().split('T')[0],
        txHash: response.hash.slice(0, 8) + "..."
      }, ...prev]);

      // Redirect to certificate
      router.push(`/verify/${account.address.toString()}/${encodeURIComponent(file.name)}`);
      
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("INSUFFICIENT_BALANCE") || error?.message?.includes("INSUFFICIENT_SHELBY_USD") || error?.name === "StaleMicropaymentErrorResponse") {
        setErrorMessage("Transaction failed. Reason: Insufficient ShelbyUSD tokens to pay for the upload chunk. Please join the Shelby Discord to request testnet funds to complete this action.");
      } else {
        setErrorMessage(error?.message || "An unexpected error occurred connecting to Shelbynet or Aptos.");
      }
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans relative overflow-hidden flex">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center animate-fluid-bg opacity-20"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative z-10">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <img src="/logo.png" alt="Meridian" className="h-6 w-auto invert opacity-90" />
          <span className="font-bold text-white text-lg">Meridian</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "upload" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Asset
          </button>
          
          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "history" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <History className="w-4 h-4" />
            Upload History
          </button>
          
          <button 
            onClick={() => setActiveTab("certificates")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "certificates" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <Shield className="w-4 h-4" />
            Certificates
          </button>
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <a href="https://docs.shelby.xyz" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
              <span>Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </nav>

        {/* User Info */}
        {connected && (
          <div className="p-4 border-t border-white/5 bg-[#0f0f0f]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {account?.address.toString().slice(2, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {account?.address.toString().slice(0, 8)}...{account?.address.toString().slice(-4)}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Shelbynet
                </p>
              </div>
              <button onClick={disconnect} className="p-2 text-neutral-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Meridian" className="h-6 w-auto invert opacity-90" />
            <span className="font-bold text-white">Meridian</span>
          </div>
          {!connected ? (
            <button onClick={handleConnect} className="text-xs text-emerald-400 font-medium">Connect</button>
          ) : (
            <button onClick={disconnect} className="text-xs text-neutral-400">{account?.address.toString().slice(0,6)}...</button>
          )}
        </div>

        <div className="max-w-[800px] mx-auto px-6 py-12">
          
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div>
              <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-3">Create Proof of Authorship</h1>
                <p className="text-neutral-400 text-sm">Upload your asset. A permanent certificate will be generated on the Shelby network tied to your wallet.</p>
              </header>

              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

                {!connected ? (
                  <div className="text-center py-12 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
                      <UploadCloud className="w-6 h-6 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Wallet Required</h3>
                    <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">Please connect your Aptos wallet (Petra, OKX) to sign the upload transaction.</p>
                    <button onClick={handleConnect} className="h-10 px-6 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 transition-transform">
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {/* Dropzone */}
                    <div 
                      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${file ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                      
                      {file ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                          <p className="text-white font-medium mb-1">{file.name}</p>
                          <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button className="mt-4 text-xs text-neutral-400 hover:text-white underline" onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}>Choose different file</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center cursor-pointer">
                          <UploadCloud className="w-10 h-10 text-neutral-500 mb-3" />
                          <p className="text-white font-medium mb-1">Click to browse or drag file here</p>
                          <p className="text-xs text-neutral-500">Images, PDFs, Documents (Max 5GB)</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {file && status !== "success" && (
                      <div className="mt-6 flex flex-col items-center">
                        <button 
                          onClick={handleUpload} 
                          disabled={status !== "idle"}
                          className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {status !== "idle" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {status === "generating" && "Generating Shelby Blob Commitments..."}
                              {status === "signing" && "Awaiting Wallet Signature..."}
                              {status === "uploading" && "Uploading Blob Chunks to RPC..."}
                            </>
                          ) : (
                            'Sign & Upload to Shelbynet'
                          )}
                        </button>
                      </div>
                    )}

                    {/* Error Message */}
                    {status === "error" && (
                      <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm leading-relaxed">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <strong className="block text-red-300 font-semibold mb-1">Upload Failed</strong>
                          {errorMessage}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-3">Upload History</h1>
                <p className="text-neutral-400 text-sm">Your recently archived assets on the Shelby network.</p>
              </header>

              {!connected ? (
                <div className="text-center py-12 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                  <p className="text-neutral-500 mb-4">Connect your wallet to view your upload history.</p>
                  <button onClick={handleConnect} className="text-sm text-emerald-400 font-medium hover:text-emerald-300">Connect Wallet</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedFiles.map((item, index) => (
                    <div key={index} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-neutral-500">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span className="text-xs text-neutral-700">•</span>
                            <span className="text-xs text-neutral-500">{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-neutral-500 font-mono">Tx: {item.txHash}</p>
                        </div>
                        <a href={`/verify/${account?.address.toString()}/${encodeURIComponent(item.name)}`} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400 hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                  
                  {uploadedFiles.length === 0 && (
                    <div className="text-center py-12 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                      <Database className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-500">No uploads found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === "certificates" && (
            <div>
              <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-3">Verify Certificate</h1>
                <p className="text-neutral-400 text-sm">Enter a certificate URL or Blob ID to verify its authenticity on the Shelby network.</p>
              </header>

              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Certificate URL or Blob ID</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="0x123.../my-file.pdf" 
                      className="flex-1 bg-[#0f0f0f] border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <button className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                      Verify
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-neutral-500">
                  <p>Example valid URL: <code className="text-neutral-400 bg-neutral-900 px-1 py-0.5 rounded">/verify/0x123.../document.pdf</code></p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}