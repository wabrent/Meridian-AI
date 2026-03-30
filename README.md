<div align="center">

# Meridian

### Immutable Proof of Authorship

A decentralized application built on the **Shelby Protocol** that turns blockchain storage into undeniable proof of ownership. Upload files, generate on-chain certificates, and permanently archive assets on the high-performance Shelby network.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Shelby Protocol](https://img.shields.io/badge/Shelby-Protocol-10b981)](https://shelby.xyz)
[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-2dd4bf)](https://aptoslabs.org)

[Live Demo](https://meridian-ai.onrender.com) · [Report Bug](https://github.com/wabrent/Meridian-AI/issues) · [Request Feature](https://github.com/wabrent/Meridian-AI/issues)

<img src="public/bg.jpg" alt="Meridian Banner" width="100%" style="border-radius: 12px; margin: 20px 0;">

</div>

---

## About The Project

**Meridian** is a Web3 application that leverages the Shelby Protocol's high-performance decentralized storage infrastructure to create immutable, on-chain proof of authorship for any digital asset.

When you upload a file through Meridian:
1. Your file is **erasure-coded** and distributed across Shelby's private fiber network
2. A **cryptographic commitment** is generated and anchored on the Aptos blockchain
3. You receive a **permanent verification URL** that anyone can use to verify your ownership

### Why Meridian?

| Traditional Storage | Meridian + Shelby |
|:------------------:|:-----------------:|
| Centralized servers | Decentralized fiber network |
| No ownership proof | On-chain certificates |
| Can be modified | Immutable & tamper-proof |
| Single point of failure | Distributed redundancy |
| Pay for storage | Paid reads incentive model |

---

## Features

### Core Capabilities

- **Wallet Integration** - Connect with Petra, OKX, or any Aptos-compatible wallet
- **Drag & Drop Upload** - Intuitive file upload with real-time progress
- **On-Chain Certificates** - Immutable proof anchored to Aptos blockchain
- **Public Verification** - Share verification URLs for instant ownership proof
- **Upload History** - Track all your archived assets in one place

### Technical Highlights

- **Erasure Coding** - Advanced data redundancy without excessive storage overhead
- **High-Bandwidth** - Shelby's private fiber network enables fast uploads/downloads
- **BFT Consensus** - Byzantine Fault Tolerance via Aptos blockchain
- **Paid Reads** - Economic model incentivizing high-quality storage providers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Meridian DApp                            │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)  │  Wallet Adapter  │  Shelby SDK Client    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Shelby Protocol                            │
├─────────────────────────────────────────────────────────────────┤
│  Erasure Coding │  Fiber Network  │  Storage Providers           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Aptos Blockchain                           │
├─────────────────────────────────────────────────────────────────┤
│  Smart Contract (0x85fdb...)  │  Transaction Settlement        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Petra Wallet** browser extension ([Install here](https://petra.app))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wabrent/Meridian-AI.git
   cd Meridian-AI
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   SHELBY_API_KEY=your_api_key_here
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a
   NEXT_PUBLIC_SHELBY_RPC_URL=https://api.shelbynet.shelby.xyz/shelby
   NEXT_PUBLIC_SHELBY_FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Usage

### Connecting Your Wallet

1. Click **"Launch App"** in the navigation
2. Click **"Connect Wallet"** button
3. Select your wallet (Petra recommended)
4. Approve the connection request

### Uploading Files

1. Navigate to the **Upload Asset** tab
2. Drag and drop your file or click to browse
3. Click **"Upload to Shelbynet"**
4. Approve the transaction in your wallet
5. Receive your permanent verification certificate

### Verifying Ownership

1. Share your verification URL:
   ```
   https://meridian-ai.onrender.com/verify/{address}/{filename}
   ```
2. Anyone can access this URL to verify:
   - File authenticity via cryptographic hash
   - Original upload timestamp
   - Owner's wallet address
   - Transaction hash on Aptos

---

## Project Structure

```
Meridian-AI/
├── public/                 # Static assets
│   ├── bg.jpg             # Animated background
│   └── logo.png           # Meridian logo
├── src/
│   ├── app/
│   │   ├── page.tsx       # Landing page
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── globals.css    # Global styles
│   │   ├── app/
│   │   │   └── page.tsx   # Main DApp dashboard
│   │   └── verify/
│   │       └── [address]/
│   │           └── [filename]/
│   │               └── page.tsx  # Certificate verification
│   └── components/
│       └── WalletProvider.tsx    # Aptos wallet context
├── render.yaml            # Render deployment config
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS config
└── package.json           # Dependencies
```

---

## API Reference

### Shelby SDK Integration

```typescript
import { 
  ShelbyBlobClient, 
  ShelbyRPCClient,
  createDefaultErasureCodingProvider 
} from '@shelby-protocol/sdk/browser';
import { Network } from '@aptos-labs/ts-sdk';

// Initialize RPC Client
const rpcClient = new ShelbyRPCClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY,
  rpc: { baseUrl: process.env.NEXT_PUBLIC_SHELBY_RPC_URL }
});

// Create register payload
const payload = await ShelbyBlobClient.createRegisterBlobPayload({
  file,
  erasureCodingProvider,
  contractAddress,
});

// Submit via wallet
const tx = await window.aptos.signAndSubmitTransaction({ payload });
```

---

## Deployment

### Render (Recommended)

1. Push your code to GitHub
2. Connect repository to [Render](https://render.com)
3. Configure build settings:
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Deploy!

### Docker

```bash
docker build -t meridian-ai .
docker run -p 3000:3000 meridian-ai
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHELBY_API_KEY` | Shelby Protocol API key | Yes |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Shelby smart contract address | Yes |
| `NEXT_PUBLIC_SHELBY_RPC_URL` | Shelbynet RPC endpoint | Yes |
| `NEXT_PUBLIC_SHELBY_FULLNODE_URL` | Shelbynet fullnode endpoint | Yes |

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Roadmap

- [x] Wallet integration (Petra)
- [x] File upload to Shelbynet
- [x] Certificate verification page
- [x] Upload history tracking
- [ ] Multi-wallet support (OKX, Pontem)
- [ ] Batch file uploads
- [ ] File encryption before upload
- [ ] NFT certificate minting
- [ ] Mobile responsive improvements
- [ ] API documentation (Swagger)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Blockchain** | Aptos |
| **Storage** | Shelby Protocol |
| **Wallet** | Petra (Aptos Wallet Adapter) |
| **Icons** | Lucide React |
| **Animation** | CSS Keyframes |
| **Deployment** | Render |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

**Meridian Team**

- GitHub: [@wabrent](https://github.com/wabrent)
- Project Link: [https://github.com/wabrent/Meridian-AI](https://github.com/wabrent/Meridian-AI)

---

## Acknowledgments

- [Shelby Protocol](https://shelby.xyz) - Decentralized high-bandwidth storage
- [Aptos Labs](https://aptoslabs.org) - Layer 1 blockchain infrastructure
- [Petra Wallet](https://petra.app) - Aptos wallet extension
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

---

<div align="center">

**Built with care for the Shelby Protocol ecosystem**

[![Star](https://img.shields.io/github/stars/wabrent/Meridian-AI?style=social)](https://github.com/wabrent/Meridian-AI)
[![Fork](https://img.shields.io/github/forks/wabrent/Meridian-AI?style=social)](https://github.com/wabrent/Meridian-AI)

</div>
