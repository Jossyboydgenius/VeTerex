# Verychain

VeTerex is built on **Verychain**, an EVM-compatible blockchain that is part of the Very Network ecosystem.

## What is Verychain?

Verychain is a fork of Ethereum designed to enhance the convenience and reliability of cryptocurrencies for mass adoption. It follows Ethereum network upgrades while maintaining its own validator network.

## Network Specifications

| Property | Value |
|----------|-------|
| **Network Name** | Verychain |
| **Chain ID** | 4613 |
| **Currency Symbol** | VERY |
| **Block Time** | 12 seconds |
| **Consensus** | Proof of Authority (PoA) |

## Network Endpoints

| Endpoint | URL |
|----------|-----|
| **Mainnet RPC** | https://rpc.verylabs.io |
| **Block Explorer** | https://veryscan.io |

## Adding Verychain to Your Wallet

To manually add Verychain network:

1. Open your wallet settings
2. Add a custom network with:
   - **Network Name:** Verychain
   - **RPC URL:** `https://rpc.verylabs.io`
   - **Chain ID:** `4613`
   - **Currency Symbol:** VERY
   - **Block Explorer:** `https://veryscan.io`

> 💡 **Tip:** If you use VeryChat, Verychain is automatically configured!

## Why Verychain?

### Benefits for VeTerex

- ⚡ **Fast Transactions** - 12 second block times
- 💰 **Low Fees** - Minimal gas costs (1 Gwei)
- 🔒 **Secure** - PoA consensus with trusted validators
- 🌐 **EVM Compatible** - Full Ethereum compatibility

### Part of Very Network

Verychain is the backbone of the Very Network ecosystem, powering:
- **VeryChat** - Messaging with built-in wallet
- **VeTerex** - Media completion NFTs
- Other ecosystem dApps

## Technical Details

### Gas Configuration
- Minimum Gas Price: 1 Gwei
- Maximum Gas Price: 500 Gwei
- Block Gas Limit: 8,000,000 (genesis)

### Development Tools
- Solidity: 0.8.19 or higher supported
- Frameworks: Hardhat, Truffle, Foundry
- Testing: Standard Ethereum dev tools work

---

**Next:** [Smart Contract →](smart-contract.md)
