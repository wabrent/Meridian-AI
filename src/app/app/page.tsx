"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft, FileText, Shield, Database, ExternalLink, History, LogOut, WifiOff, Trash2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/components/WalletProvider";
import { ShelbyClient, ShelbyBlobClient, createDefaultErasureCodingProvider, generateCommitments, expectedTotalChunksets } from "@shelby-protocol/sdk/browser";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

type TabType = "upload" | "history" | "certificates";

const aptosClient = new Aptos(
  new AptosConfig({
    network: Network.SHELBYNET,
    fullnode: "https://api.shelbynet.shelby.xyz/v1",
  }),
);

interface UploadedFile {
  name: string;
  size: number;
  date: string;
  txHash: string;
}

// Safe address getter - avoids crashes when account/address undefined
const safeAddress = (account: any): string => {
  try {
    return account?.address?.toString() || "";
  } catch {
    return "";
  }
};

export default function AppDashboard() {
  const { account, connected, connect, disconnect, wallets, signAndSubmitTransaction } = useWallet();
  const { isCorrectNetwork } = useNetwork();
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "signing" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const accountAddress = safeAddress(account);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('meridian_theme');
      return saved !== 'light';
    }
    return true;
  });

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light', !isDarkMode);
      localStorage.setItem('meridian_theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Load history from localStorage
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('meridian_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && uploadedFiles.length > 0) {
      localStorage.setItem('meridian_history', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          showToast(error, "error");
        } else {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        setStatus("idle");
        showToast(`${validFiles.length} file(s) added`, "info");
      }
    }
  };

  // Copy wallet address
  const copyAddress = () => {
    if (accountAddress) {
      navigator.clipboard.writeText(accountAddress);
      showToast("Address copied!", "success");
    }
  };

  // Delete from history
  const deleteFromHistory = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    showToast("Deleted from history", "info");
  };

  // Search in history
  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory = uploadedFiles.filter(item => 
    item.name.toLowerCase().includes(historySearch.toLowerCase())
  );

  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<{success: boolean; message: string} | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  const handleVerify = async () => {
    if (!verifyInput.trim()) {
      showToast("Please enter a certificate URL or Blob ID", "error");
      return;
    }

    setVerifyResult(null);
    showToast("Verifying...", "info");

    try {
      let url = verifyInput;
      if (!url.startsWith('/') && !url.startsWith('0x')) {
        url = '/' + url;
      }
      router.push(url);
    } catch (error) {
      setVerifyResult({success: false, message: "Invalid certificate URL or ID"});
      showToast("Verification failed", "error");
    }
  };

  // Generate QR code URL for certificate
  const generateQRCode = (item: UploadedFile) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const certUrl = `${baseUrl}/verify/${accountAddress}/${encodeURIComponent(item.name)}`;
    // Use a simple QR code API
    setQrUrl(certUrl);
    setShowQR(true);
  };

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return "File size must be less than 50MB";
    }
    const allowedTypes = ['image/*', 'application/pdf', 'text/*', 'application/json', 'video/*', 'audio/*'];
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });
    if (!isAllowed && file.type) {
      return "File type not supported";
    }
    return null;
  };

  const handleConnect = async () => {
    console.log("Connecting to wallet...");
    console.log("Available wallets:", wallets);
    // Show wallet selector if multiple wallets available
    if (wallets && wallets.length > 0) {
      setShowWalletSelector(true);
    } else {
      try {
        await connect("Petra");
      } catch (e) {
        console.error("Connect error:", e);
      }
    }
  };

  const handleWalletSelect = async (wallet: any) => {
    setShowWalletSelector(false);
    try {
      await connect(wallet.name);
    } catch (e) {
      console.error("Connect error:", e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          showToast(error, "error");
        } else {
          validFiles.push(file);
        }
      }
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        setStatus("idle");
        showToast(`${validFiles.length} file(s) selected`, "info");
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { shelbyClient: contextClient } = useNetwork();

  const handleUpload = useCallback(async () => {
    console.log("=== Upload Check ===");
    console.log("account:", account);
    console.log("files:", files);
    console.log("signAndSubmitTransaction:", signAndSubmitTransaction);
    console.log("account.address:", accountAddress);
    
    if (!account || files.length === 0 || !signAndSubmitTransaction || !accountAddress) {
      console.log("Missing requirements - account, files or signAndSubmitTransaction");
      setErrorMessage("Please connect wallet and select a file first");
      showToast("Please connect wallet and select a file", "error");
      setStatus("error");
      return;
    }

    // Prevent double submission
    if (status === "generating" || status === "signing" || status === "uploading") {
      console.log("Upload already in progress - skipping duplicate");
      return;
    }

    try {
      setStatus("generating");
      setUploadProgress(10);
      console.log("Step 1: Generating commitments...");
      
      const arrayBuffer = await files[0].arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      setUploadProgress(20);
      
      // Generate commitments
      const provider = await createDefaultErasureCodingProvider();
      const commitments = await generateCommitments(provider, data);
      console.log("Commitments generated:", commitments);
      setUploadProgress(40);
      
      setStatus("signing");
      console.log("Step 2: Creating registration payload...");
      
      // Register blob on-chain via wallet (10 args matching Shelbynet contract v2)
      const deployerAddress = process.env.NEXT_PUBLIC_SHELBY_CONTRACT_ADDRESS || "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";
      const merkleRootBytes = typeof commitments.blob_merkle_root === 'string'
        ? (() => {
            const hex = commitments.blob_merkle_root.replace('0x', '');
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < bytes.length; i++) {
              bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
            }
            return bytes;
          })()
        : commitments.blob_merkle_root as Uint8Array;
      const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;
      const numChunksets = expectedTotalChunksets(commitments.raw_data_size);
      
      const payload = {
        function: `${deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [
          files[0].name,
          "shelbynet-1",
          null,
          expirationMicros,
          merkleRootBytes,
          numChunksets,
          commitments.raw_data_size,
          0,
          0,
          0
        ]
      };
      
      console.log("Payload args:", JSON.stringify(payload.functionArguments));
      
      console.log("Submitting registration transaction...");
      const transactionSubmitted = await signAndSubmitTransaction({
        data: payload
      });
      console.log("Transaction submitted:", transactionSubmitted.hash);
      setUploadProgress(60);
      
      // Wait for transaction confirmation and get events for UID
      console.log("Waiting for transaction confirmation...");
      const txn = await aptosClient.waitForTransaction({
        transactionHash: transactionSubmitted.hash,
      });
      console.log("Transaction confirmed!");
      setUploadProgress(75);
      
      // Extract UID from BlobRegisteredEvent
      const uidEntries = ShelbyBlobClient.registeredBlobUids(
        (txn as any).events || [],
        AccountAddress.fromString(deployerAddress)
      );
      console.log("UID entries:", uidEntries);
      
      if (uidEntries.length === 0) {
        throw new Error("No BlobRegisteredEvent found in transaction. Registration may have failed.");
      }
      
      setStatus("uploading");
      console.log("Step 3: Uploading data via RPC...");
      
      // Upload data directly via RPC using new chunkset API
      await contextClient.rpc.putBlobChunksets({
        accountAddress: accountAddress,
        uid: uidEntries[0].uid,
        blobData: data,
        commitments,
      });
      
      console.log("Upload successful!");
      setUploadProgress(100);
      setStatus("success");
      
      const fileName = files[0]?.name || "unknown";
      
      setUploadedFiles(prev => [{
        name: fileName,
        size: files[0]?.size || 0,
        date: new Date().toISOString().split('T')[0],
        txHash: "Confirmed"
      }, ...prev]);
      
      showToast("File uploaded to Shelbynet!", "success");
      setFiles([]);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage(error?.message || "An unexpected error occurred");
      setStatus("error");
      setUploadProgress(0);
      showToast("Error: " + (error?.message || "Unknown error"), "error");
    }
  }, [account, files, signAndSubmitTransaction, contextClient, status, accountAddress]);

  return (
    <div className={`min-h-screen font-sans relative overflow-hidden flex transition-colors duration-300 ${
      isDarkMode 
        ? "bg-[#050505] text-neutral-200" 
        : "bg-gray-50 text-gray-900"
    }`}>
      
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
                  className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition-colors flex items-center justify-between"
                >
                  <span className="text-white font-medium">{w.name}</span>
                  <span className="text-xs text-neutral-500">Connect</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowWalletSelector(false)} className="mt-4 w-full py-2 text-neutral-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm animate-slide-in ${
          toast.type === "success" ? "bg-emerald-500/90 text-white" :
          toast.type === "error" ? "bg-red-500/90 text-white" :
          "bg-neutral-800/90 text-white"
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
      
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Certificate QR Code</h3>
            <div className="bg-white p-4 rounded-xl mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs text-neutral-500 mb-4 break-all">{qrUrl.slice(0, 50)}...</p>
            <button onClick={() => setShowQR(false)} className="mt-4 w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200">
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700"
      >
        {isDarkMode ? "🌙" : "☀️"}
      </button>
      
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
            {/* Network Info */}
            <div className="px-4 py-3">
              <p className="text-xs text-neutral-500 mb-1">Network</p>
              <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Shelbynet
              </p>
            </div>
            
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
                {accountAddress.slice(2, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {accountAddress.slice(0, 8)}...{accountAddress.slice(-4)}
                  </p>
                  <button onClick={copyAddress} className="text-neutral-500 hover:text-emerald-400" title="Copy address">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
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
            <button onClick={disconnect} className="text-xs text-neutral-400">{accountAddress.slice(0,6)}...</button>
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
                    {/* Dropzone with Drag & Drop */}
                    <div 
                      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${files.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                      
                      {files.length > 0 ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                          <p className="text-white font-medium mb-1">{files.length} file(s) selected</p>
                          <div className="max-h-32 overflow-y-auto w-full mt-2">
                            {files.map((f, i) => (
                              <div key={i} className="flex items-center justify-between bg-neutral-900 rounded-lg px-3 py-2 mb-1">
                                <span className="text-sm text-neutral-300 truncate max-w-[200px]">{f.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-neutral-500 hover:text-red-400">×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button className="mt-4 text-xs text-neutral-400 hover:text-white underline" onClick={(e) => { e.stopPropagation(); setFiles([]); setStatus("idle"); }}>Clear all</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center cursor-pointer">
                          <UploadCloud className="w-10 h-10 text-neutral-500 mb-3" />
                          <p className="text-white font-medium mb-1">Click to browse or drag files here</p>
                          <p className="text-xs text-neutral-500">Images, PDFs, Documents (Max 50MB per file)</p>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress > 0 && (
                      <div className="mt-4">
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 text-center">{uploadProgress}%</p>
                      </div>
                    )}

                    {/* Action Button */}
                    {files.length > 0 && status !== "success" && (
                      <div className="mt-6 flex flex-col items-center">
                        <button 
                          onClick={handleUpload} 
                          disabled={status === "generating" || status === "signing" || status === "uploading"}
                          className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {status === "generating" || status === "signing" || status === "uploading" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {status === "generating" && "Generating commitments..."}
                              {status === "signing" && "Awaiting wallet signature..."}
                              {status === "uploading" && "Uploading to Shelby..."}
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
                
                {/* Search */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <input 
                      type="text" 
                      placeholder="Search files..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0f0f0f] border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                )}
              </header>

              {!connected ? (
                <div className="text-center py-12 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                  <p className="text-neutral-500 mb-4">Connect your wallet to view your upload history.</p>
                  <button onClick={handleConnect} className="text-sm text-emerald-400 font-medium hover:text-emerald-300">Connect Wallet</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedFiles.map((item, index) => (
                    <div key={index} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 flex items-center justify-between hover-lift transition-all duration-300">
                      <div className="flex items-center gap-4">
                        {item.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                          <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                            <img src={`/verify/${accountAddress}/${encodeURIComponent(item.name)}`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-neutral-500">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span className="text-xs text-neutral-700">•</span>
                            <span className="text-xs text-neutral-500">{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-neutral-500 font-mono">Tx: {item.txHash}</p>
                          {item.fullTxHash && (
                            <a 
                              href={`https://explorer.aptoslabs.com/txn/${item.fullTxHash}?network=shelbynet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-500 hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Explorer
                            </a>
                          )}
                        </div>
                        <button onClick={() => generateQRCode(item)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400 hover:text-white" title="Generate QR Code">
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteFromHistory(index)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400 hover:text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                      className="flex-1 bg-[#0f0f0f] border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <button onClick={handleVerify} className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                      Verify
                    </button>
                  </div>
                </div>
                
                {verifyResult && (
                  <div className={`mt-4 p-4 rounded-lg ${verifyResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {verifyResult.message}
                  </div>
                )}
                
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
