# NFT Bulk Mint CLI

A production-ready command-line tool for bulk minting NFTs on Ethereum-compatible blockchains.

## Quick Install

```bash
# Install globally via npm
npm install -g nft-mint

# Or run directly with npx
npx nft-mint --help
```

## Features

- **Batch Minting**: Automatically divides large mint quantities into manageable batches
- **Multi-Network Support**: Works with any EVM-compatible blockchain (Ethereum, Polygon, Base, Arbitrum, etc.)
- **Progress Tracking**: Real-time progress bar and detailed transaction logs
- **Comprehensive Logging**: All minting details saved to `mint-log.json`
- **Error Handling**: Graceful error handling with retry options
- **Security**: Private key support via CLI or `.env` file (never committed)

## Usage

### Basic Usage

```bash
# Mint 1 NFT
nft-mint --contract 0x1234567890abcdef1234567890abcdef12345678
```

### With Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://eth.llamarpc.com
```

Then run:

```bash
nft-mint --contract 0x1234567890abcdef1234567890abcdef12345678 --quantity 100
```

### Full Command Examples

```bash
# Mint 100 NFTs
nft-mint --contract 0xCONTRACT_ADDRESS --quantity 100 --rpc https://eth.llamarpc.com

# Skip confirmation (for automation)
nft-mint --contract 0xCONTRACT --quantity 50 --no-confirm

# Custom RPC URL
nft-mint --contract 0xCONTRACT --rpc https://polygon-rpc.com --quantity 25

# Specify gas limit
nft-mint --contract 0xCONTRACT --quantity 5 --gasLimit 100000
```

### Command-Line Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--contract` | `-c` | NFT contract address (required) | - |
| `--quantity` | `-q` | Number of NFTs to mint | 1 |
| `--privateKey` | `-k` | Wallet private key | from .env |
| `--rpc` | `-r` | RPC URL | from .env |
| `--batchSize` | `-b` | Max NFTs per batch | 10 |
| `--mintAmount` | `-m` | NFTs per mint call | 1 |
| `--gasLimit` | `-g` | Gas limit per transaction | auto |
| `--no-confirm` | - | Skip confirmation | false |

## Output Example

```
╔═══════════════════════════════════════════════════════════╗
║         🚀 NFT Bulk Minting CLI - Production Ready        ║
╚═══════════════════════════════════════════════════════════╝

📋 Configuration:
────────────────────────────────────────
  Contract:     0x1234567890abcdef1234567890abcdef12345678
  Quantity:     100 NFTs
  Batch Size:   1 per tx
  Wallet:       0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71
  Network:      https://eth.llamarpc.com
────────────────────────────────────────

💰 Wallet Balance: 0.5 ETH

🔄 Connecting to contract...

✓ Connected to contract successfully!

Minting Progress: |████████████| 100% | 100/100 batches

╔═══════════════════════════════════════════════════════════╗
║                    ✅ MINTING COMPLETE                     ║
╚═══════════════════════════════════════════════════════════╝

📊 Summary:
────────────────────────────────────────
  Total Batches:     100
  Total NFTs Minted: 100
  Total Gas Used:    15000000 units

📝 Logs saved to: mint-log.json
```

## Log File

All minting transactions are logged to `mint-log.json`:

```json
[
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "batchNumber": 1,
    "quantityMinted": 1,
    "transactionHash": "0xabc123...",
    "blockNumber": 12345678,
    "gasUsed": "150000",
    "status": "success",
    "from": "0x742d...",
    "contract": "0x1234..."
  }
]
```

## Supported Networks

- Ethereum: `https://eth.llamarpc.com`
- Polygon: `https://polygon-rpc.com`
- Base: `https://base.llamarpc.com`
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- Optimism: `https://mainnet.optimism.io`

## Security Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- **Use a separate wallet** for minting - don't use your main wallet
- **Test first** on testnet before mainnet

## License

MIT

## Author

[Deji-Tech](https://github.com/Deji-Tech)
