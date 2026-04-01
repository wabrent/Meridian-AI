"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Database, FileText, ArrowLeft, ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface VerificationData {
  exists: boolean;
  blob_name?: string;
  owner?: string;
  created_at?: string;
  size?: number;
  expires_at?: string;
  num_chunksets?: number;
}

export default function VerifyPage({ params }: { params: Promise<{ address: string; filename: string }> }) {
  const unwrappedParams = use(params);
  const { address, filename } = unwrappedParams;
  const decodedFilename = decodeURIComponent(filename);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyBlob() {
      setLoading(true);
      setError(null);
      
      try {
        const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || '';
        
        const response = await fetch(
          `https://api.shelbynet.shelby.xyz/shelby/v1/blobs?owner=eq.${address}&blob_name=eq.${encodeURIComponent(decodedFilename)}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result && result.length > 0) {
            setData({
              exists: true,
              blob_name: result[0].blob_name,
              owner: result[0].owner,
              created_at: result[0].created_at,
              size: result[0].size,
              expires_at: result[0].expires_at,
              num_chunksets: result[0].num_chunksets
            });
          } else {
            setData({ exists: false });
          }
        } else {
          // API might not be available, use mock data for demo
          setData({ exists: false });
        }
      } catch (err) {
        console.error("Verification error:", err);
        // Fallback to showing page (API not available)
        setData({ exists: false });
      } finally {
        setLoading(false);
      }
    }

    verifyBlob();
  }, [address, decodedFilename]);

  const [date] = useState(new Date().toLocaleString());
  const verifiedData = data?.exists ? data : null;

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans relative overflow-hidden flex flex-col items-center pt-24 pb-12 px-6">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center animate-fluid-bg opacity-30"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-10">
          <Link href="/app" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to App</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Meridian" className="h-6 w-auto invert opacity-90 object-contain" />
          </div>
        </div>

        {loading ? (
          <div className="bg-[#0a0a0a]/90 border border-white/10 rounded-3xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-500 mb-4" />
            <p className="text-neutral-400">Verifying on Shelby network...</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0a]/90 border border-emerald-500/20 rounded-3xl p-8 md:p-12 shadow-[0_0_100px_rgba(16,185,129,0.1)] backdrop-blur-xl relative">
            
            {verifiedData ? (
              <>
                {/* Glowing badge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-emerald-500 text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Certificate
                  </div>
                </div>

                <div className="text-center mt-6 mb-12">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">Immutable Proof of Authorship</h1>
                  <p className="text-neutral-400">This asset is permanently stored on the Shelby Protocol and cryptographically bound to the author's Aptos wallet.</p>
                </div>

                <div className="space-y-6">
                  {/* Asset Box */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Asset Name</h3>
                        <p className="text-lg text-white font-medium truncate">{verifiedData.blob_name}</p>
                        {verifiedData.size && (
                          <p className="text-xs text-neutral-500 mt-1">{(verifiedData.size / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Author Box */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Author's Wallet (Shelbynet)</h3>
                        <p className="text-sm md:text-base text-white font-mono truncate">{verifiedData.owner}</p>
                      </div>
                    </div>
                  </div>

                  {/* Network Box */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Database className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Storage Network</h3>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <p className="text-white font-medium">Shelbynet RPC Nodes</p>
                        </div>
                        {verifiedData.created_at && (
                          <p className="text-xs text-neutral-500 mt-2">Created: {new Date(verifiedData.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <a 
                    href={`https://explorer.shelby.xyz/shelbynet/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    View on Shelby Explorer <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Not found */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Not Verified
                  </div>
                </div>

                <div className="text-center mt-6 mb-8">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">Certificate Not Found</h1>
                  <p className="text-neutral-400">This asset was not found on the Shelby network. The file may not have been uploaded yet or was deleted.</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Searched Asset</h3>
                        <p className="text-lg text-white font-medium truncate">{decodedFilename}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Searched Wallet</h3>
                        <p className="text-sm md:text-base text-white font-mono truncate">{address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <Link href="/app" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                    Upload this file to create a certificate <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}