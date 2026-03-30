# Meridian - Project Overview

## What is Meridian?

**Meridian** is a decentralized application (DApp) that enables users to create **immutable proof of authorship** for any digital asset using the Shelby Protocol and Aptos blockchain.

Think of it as a **digital notary** that permanently certifies when and by whom a file was created.

---

## The Problem We Solve

| Challenge | Meridian's Solution |
|-----------|---------------------|
| Digital files can be easily copied and stolen | On-chain certificates prove original ownership |
| No way to timestamp digital work | Blockchain provides immutable timestamps |
| Centralized storage can be modified or deleted | Shelby's decentralized network ensures permanence |
| Difficult to prove authorship in disputes | Cryptographic proof verifiable by anyone |

---

## How It Works (Simple Explanation)

```
User uploads file → File is erasure-coded → Stored on Shelby fiber network → 
Certificate minted on Aptos → User gets verification URL
```

### Step-by-Step Process:

1. **Connect Wallet**
   - User connects their Petra wallet to the DApp
   - Wallet address becomes their unique identity

2. **Upload File**
   - User drags and drops any file (images, documents, code, etc.)
   - File is processed client-side (never sent to our servers)

3. **Shelby Protocol Processing**
   - File is erasure-coded for redundancy
   - Chunks are distributed across Shelby's private fiber network
   - Metadata is anchored on Aptos blockchain

4. **Certificate Generated**
   - Unique verification URL is created
   - Contains: owner address, file hash, timestamp, transaction ID

5. **Permanent Verification**
   - Anyone can visit the verification URL
   - They can see: who owns it, when it was uploaded, the file hash
   - This proof cannot be faked or modified

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Wallet Integration**: Aptos Wallet Adapter (Petra)

### Blockchain Layer
- **Network**: Shelbynet (Shelby Protocol's dedicated network)
- **Settlement**: Aptos Blockchain
- **Smart Contract**: `0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a`

### Storage Layer
- **Protocol**: Shelby Protocol
- **Encoding**: Erasure Coding (for redundancy and efficiency)
- **Transport**: Private fiber network (high bandwidth)
- **Incentive Model**: Paid Reads

---

## Key Features

### 1. Wallet Integration
- Seamless connection with Petra wallet
- No account creation required
- Wallet address is your identity

### 2. Drag & Drop Upload
- Intuitive file selection
- Support for any file type
- Real-time upload progress

### 3. On-Chain Certificates
- Permanent proof anchored to Aptos
- Cannot be deleted or modified
- Includes cryptographic file hash

### 4. Public Verification
- Share verification URLs with anyone
- No login required to verify
- Proof is cryptographically verifiable

### 5. Upload History
- Dashboard shows all your uploads
- Quick access to verification URLs
- Track your archived assets

---

## Why Shelby Protocol?

We chose Shelby Protocol because of its unique advantages:

| Feature | Benefit |
|---------|---------|
| **High-Bandwidth Fiber Network** | Fast uploads even for large files |
| **Erasure Coding** | Data redundancy without excessive storage costs |
| **Aptos Settlement** | Fast, cheap, and secure blockchain anchoring |
| **Paid Reads Model** | Incentivizes storage providers for quality service |
| **Byzantine Fault Tolerance** | Network remains secure even with malicious nodes |

---

## Use Cases

### For Content Creators
- Prove ownership of digital art, music, videos
- Timestamp creative work for copyright purposes
- Create verifiable proof of original authorship

### For Developers
- Archive code repositories with proof of creation
- Store API keys and configurations securely
- Create timestamped releases

### For Businesses
- Document contracts with immutable timestamps
- Archive important business records
- Create tamper-proof audit trails

### For Researchers
- Timestamp research papers and data
- Prove discovery priority
- Archive datasets permanently

---

## Technical Implementation

### Shelby SDK Integration

```typescript
// Browser-based upload using Shelby SDK
import { ShelbyBlobClient, ShelbyRPCClient } from '@shelby-protocol/sdk/browser';

// Initialize RPC client for Shelbynet
const rpcClient = new ShelbyRPCClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY,
  rpc: { baseUrl: 'https://api.shelbynet.shelby.xyz/shelby' }
});

// Create register payload (client-side)
const payload = await ShelbyBlobClient.createRegisterBlobPayload({
  file,
  erasureCodingProvider: createDefaultErasureCodingProvider(),
  contractAddress: CONTRACT_ADDRESS,
});

// Submit via Petra wallet
const tx = await window.aptos.signAndSubmitTransaction({ payload });
```

### Certificate Verification

```typescript
// Public verification endpoint
// Route: /verify/[address]/[filename]

// Anyone can access this URL to verify:
// 1. File authenticity via cryptographic hash
// 2. Original upload timestamp
// 3. Owner's wallet address
// 4. Transaction hash on Aptos
```

---

## Project Structure

```
Meridian-AI/
├── public/                    # Static assets
│   ├── bg.jpg                # Animated background
│   └── logo.png              # Meridian logo
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── globals.css       # Global styles
│   │   ├── app/
│   │   │   └── page.tsx      # Main DApp dashboard
│   │   └── verify/
│   │       └── [address]/
│   │           └── [filename]/
│   │               └── page.tsx  # Certificate verification
│   └── components/
│       └── WalletProvider.tsx    # Aptos wallet context
├── render.yaml               # Render deployment config
├── next.config.ts            # Next.js configuration
└── package.json              # Dependencies
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SHELBY_API_KEY` | Shelby Protocol API key | `aptoslabs_xxx` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Shelby smart contract | `0x85fdb...` |
| `NEXT_PUBLIC_SHELBY_RPC_URL` | Shelbynet RPC endpoint | `https://api.shelbynet...` |
| `NEXT_PUBLIC_SHELBY_FULLNODE_URL` | Shelbynet fullnode | `https://api.shelbynet...` |

---

## Deployment

Meridian is deployed on **Render** with the following configuration:

```yaml
services:
  - type: web
    name: meridian-ai
    runtime: node
    buildCommand: npm install --legacy-peer-deps && npm run build
    startCommand: npm start
```

---

## Future Roadmap

- [ ] Multi-wallet support (OKX, Pontem)
- [ ] Batch file uploads
- [ ] File encryption before upload
- [ ] NFT certificate minting
- [ ] Mobile app version
- [ ] API for programmatic uploads
- [ ] Collaboration features

---

## FAQ

**Q: Is my file stored on-chain?**
A: No. The file is stored on Shelby's fiber network. Only the metadata (hash, timestamp, owner) is stored on Aptos blockchain.

**Q: Can I delete my uploaded file?**
A: Files on Shelby are designed for permanent storage. However, the verification certificate can be marked as inactive.

**Q: What file types are supported?**
A: Any file type - images, videos, documents, code, archives, etc.

**Q: How much does it cost?**
A: Upload cost depends on file size and current Shelby network fees. You need ShelbyUSD tokens.

**Q: Can others verify my ownership?**
A: Yes! Share your verification URL with anyone. They can see the proof without logging in.

---

## Links

- **Live Demo**: https://meridian-ai.onrender.com
- **GitHub**: https://github.com/wabrent/Meridian-AI
- **Shelby Protocol**: https://shelby.xyz
- **Shelby Docs**: https://docs.shelby.xyz
- **Aptos**: https://aptoslabs.org

---

## Contact

For questions, feedback, or collaboration:
- GitHub Issues: https://github.com/wabrent/Meridian-AI/issues
- Shelby Discord: https://discord.gg/shelbyserves

---

*Built with care for the Shelby Protocol ecosystem*
