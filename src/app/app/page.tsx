"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft, FileText, Shield, Database, ExternalLink, History, LogOut, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/components/WalletProvider";
import { useUploadBlobs } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

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
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "signing" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Mock history data (in real app, this would come from blockchain/indexer)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleConnect = async () => {
    console.log("Connecting to Petra wallet...");
    try {
      // Direct connection to Petra
      await connect("Petra");
    } catch (e) {
      console.error("Connect error:", e);
    }
  };

  const handleWalletSelect = async (wallet: any) => {
    setShowWalletSelector(false);
    await connect(wallet.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const { shelbyClient: contextClient } = useNetwork();
  
  const uploadBlobs = useUploadBlobs({
    client: contextClient,
    onSuccess: (data: any) => {
      console.log("Upload successful!", data);
      setStatus("success");
      // @ts-ignore
      const txHash = data?.hash || data?.txHash || "unknown";
      setUploadedFiles(prev => [{
        name: file?.name || "",
        size: file?.size || 0,
        date: new Date().toISOString().split('T')[0],
        txHash: txHash.slice(0, 8) + "..."
      }, ...prev]);
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      setErrorMessage(error?.message || "Upload failed");
      setStatus("error");
    },
  });

  const handleUpload = useCallback(async () => {
    console.log("=== Upload Check ===");
    console.log("account:", account);
    console.log("file:", file);
    console.log("signAndSubmitTransaction:", signAndSubmitTransaction);
    console.log("account.address:", account?.address);
    
    if (!account || !file || !signAndSubmitTransaction) {
      console.log("Missing requirements - account, file or signAndSubmitTransaction");
      setErrorMessage("Please connect wallet and select a file first");
      setStatus("error");
      return;
    }

    try {
      setStatus("generating");
      console.log("Starting upload...");
      
      const arrayBuffer = await file.arrayBuffer();
      const blobData = new Uint8Array(arrayBuffer);
      
      const expirationMicros = Date.now() * 1000 + 86400000000; // 1 day

      console.log("Uploading with React SDK...");
      
      uploadBlobs.mutate({
        signer: { 
          account: account.address, 
          signAndSubmitTransaction 
        },
        blobs: [{ blobName: file.name, blobData }],
        expirationMicros,
      });
      
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "An unexpected error occurred");
      setStatus("error");
    }
  }, [account, file, signAndSubmitTransaction, uploadBlobs]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans relative overflow-hidden flex">
      
      {/* Wallet Selector Modal */}
      {showWalletSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowWalletSelector(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Select Wallet</h3>
            <div className="space-y-2">
              {wallets.map((w: any) => (
                <button 
                  key={w.name}
                  onClick={() => handleWalletSelect(w)}
                  className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-white font-medium">{w.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowWalletSelector(false)} className="mt-4 w-full py-2 text-neutral-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
      
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
                          disabled={uploadBlobs.isPending}
                          className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {uploadBlobs.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading to Shelby...
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
