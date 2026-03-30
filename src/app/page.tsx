"use client";
import React from 'react';
import Link from 'next/link';
import { Database, ShieldCheck, Zap, ArrowRight, UploadCloud, FileCheck, ChevronRight, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-emerald-500/30 overflow-hidden relative flex flex-col">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center animate-fluid-bg opacity-30 mix-blend-screen"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-grow">
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Meridian" className="h-8 w-auto invert opacity-90 object-contain" />
              </div>
              <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-neutral-400">
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#documentation" className="hover:text-white transition-colors">Documentation</a>
                <a href="https://docs.shelby.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Shelby Docs <ExternalLink className="w-3 h-3"/></a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/wabrent/Meridian-AI" target="_blank" rel="noopener noreferrer" className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="/app" className="h-9 px-5 rounded-full border border-white/20 text-white text-[13px] font-medium hover:bg-white hover:text-black transition-all flex items-center gap-2">
                Launch App &rarr;
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center">
          {/* Abstract Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 blur-[100px] rounded-full opacity-50" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-neutral-300 tracking-wider uppercase">Now live on Shelbynet</span>
            </div>

            <h1 className="text-[56px] md:text-[80px] leading-[1.1] font-bold tracking-tight text-white mb-6">
              Immutable Proof <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-600">of Authorship</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Turn decentralized storage into undeniable proof. Upload your original work, generate on-chain certificates, and permanently archive assets on the high-performance Shelby network.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/app" className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2">
                Start Archiving 🛡️
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto h-12 px-8 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center">
                View Certificates Demo
              </a>
            </div>
          </div>
        </section>

        {/* Marquee Ticker */}
        <div className="border-y border-white/5 bg-[#0a0a0a] overflow-hidden py-4">
          <div className="marquee-container flex items-center">
            <div className="marquee-content flex gap-16 whitespace-nowrap opacity-40 text-[11px] font-bold tracking-[0.2em] uppercase text-white">
              <span className="inline-flex items-center"><span className="text-emerald-400">◆</span>&nbsp;Shelby</span>
              <span>Shelby Protocol</span>
              <span>Aptos</span>
              <span>Petra Wallet</span>
              <span>Proof of Origin</span>
              <span>Shelbynet</span>
              <span>Immutable</span>
              <span>Permanent Storage</span>
              <span>Decentralized</span>
              <span>Blob Storage</span>
              <span>Erasure Coding</span>
              <span>Meridian</span>
              <span className="inline-flex items-center"><span className="text-emerald-400">◆</span>&nbsp;Shelby</span>
              <span>Shelby Protocol</span>
              <span>Aptos</span>
              <span>Petra Wallet</span>
              <span>Proof of Origin</span>
              <span>Shelbynet</span>
              <span>Immutable</span>
              <span>Permanent Storage</span>
              <span>Decentralized</span>
              <span>Blob Storage</span>
              <span>Erasure Coding</span>
              <span>Meridian</span>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-container {
            width: 200%;
            overflow: hidden;
          }
          .marquee-content {
            animation: scroll 30s linear infinite;
            width: 200%;
          }
        `}} />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 bg-[#0a0a0a]/50 border-b border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-neutral-400">Three simple steps to create permanent proof of your work.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block -z-10" />
              
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-6 group-hover:scale-110 transition-transform">1</div>
                <h3 className="text-xl font-bold text-white mb-3">Connect Wallet</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Connect your Aptos wallet (Petra, OKX) to sign transactions. Your wallet address is your unique identity.</p>
              </div>

              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-6 group-hover:scale-110 transition-transform">2</div>
                <h3 className="text-xl font-bold text-white mb-3">Upload Asset</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Your file is erasure-coded and uploaded to the dedicated Shelby fiber network. The metadata is permanently anchored on Aptos.</p>
              </div>

              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-6 group-hover:scale-110 transition-transform">3</div>
                <h3 className="text-xl font-bold text-white mb-3">Share Proof</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Get a permanent verification URL. Anyone can verify your authorship and download the asset without intermediaries.</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a href="/app" className="inline-flex items-center gap-2 text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                Try it now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 border-b border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Built for the Future of Data</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex gap-4">
                <div className="mt-1 bg-emerald-500/10 p-2 rounded-lg h-fit border border-emerald-500/20">
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">High-Bandwidth Storage</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Powered by the Shelby Protocol's dedicated private fiber network. Ideal for heavy read workloads like AI datasets, 4K video, and large software packages.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-blue-500/10 p-2 rounded-lg h-fit border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Aptos Settlement</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Your proofs are anchored on the Aptos blockchain, ensuring Byzantine Fault Tolerance (BFT) and permanent immutability without high gas fees.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-purple-500/10 p-2 rounded-lg h-fit border border-purple-500/20">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Paid Reads Incentive</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Unlike other networks, Shelby rewards Storage Providers for high-quality service and fast delivery via its unique "paid reads" economic model.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-cyan-500/10 p-2 rounded-lg h-fit border border-cyan-500/20">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Erasure Coding</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Advanced erasure coding minimizes recovery bandwidth and storage costs while ensuring your data is safely replicated across the decentralized network.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation / CTA Section */}
        <section id="documentation" className="py-24 px-6 bg-[#0a0a0a] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/10 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to build?</h2>
            <p className="text-neutral-400 mb-10 max-w-2xl mx-auto">
              Meridian is open source and built on top of Shelby. Check out the official documentation to learn more about the architecture, nodes, and SDK integration.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="https://docs.shelby.xyz" target="_blank" rel="noopener noreferrer" className="block p-6 rounded-xl border border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1a] hover:border-white/20 transition-all group">
                <h3 className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors">Official Documentation</h3>
                <p className="text-xs text-neutral-500">docs.shelby.xyz</p>
              </a>
              <a href="https://discord.gg/shelbyserves" target="_blank" rel="noopener noreferrer" className="block p-6 rounded-xl border border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1a] hover:border-white/20 transition-all group">
                <h3 className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors">Join Community</h3>
                <p className="text-xs text-neutral-500">Discord Server</p>
              </a>
              <a href="https://explorer.shelby.xyz/shelbynet" target="_blank" rel="noopener noreferrer" className="block p-6 rounded-xl border border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1a] hover:border-white/20 transition-all group">
                <h3 className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors">Block Explorer</h3>
                <p className="text-xs text-neutral-500">Explore Transactions</p>
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050505] pt-12 pb-8 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Meridian" className="h-6 w-auto invert opacity-50" />
            <span className="text-sm text-neutral-500">© {new Date().getFullYear()} Meridian. Built on Shelby Protocol.</span>
          </div>
          <div className="flex gap-6 text-sm text-neutral-500 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="https://docs.shelby.xyz" target="_blank" className="hover:text-white transition-colors">Documentation</a>
            <a href="/app" className="hover:text-white transition-colors">App</a>
          </div>
        </div>
      </footer>

    </div>
  );
}