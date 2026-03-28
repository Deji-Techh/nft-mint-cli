# NFT Bulk Mint CLI

A production-ready command-line tool for bulk minting NFTs on Ethereum-compatible blockchains.

## Features

- **Batch Minting**: Automatically divides large mint quantities into manageable batches
- **Multi-Network Support**: Works with any EVM-compatible blockchain (Ethereum, Polygon, Base, Arbitrum, etc.)
- **Progress Tracking**: Real-time progress bar and detailed transaction logs
- **Comprehensive Logging**: All minting details saved to `mint-log.json`
- **Error Handling**: Graceful error handling with retry options
- **Security**: Private key support via CLI or `.env` file (never committed)

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone or download the project
cd nft-mint-bulk

# Install dependencies
npm install

# Make the script executable (optional)
chmod +x index.js
```

## Configuration

### Option 1: Using .env File (Recommended)

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Your wallet private key (MUST start with 0x)
PRIVATE_KEY=0xyour_private_key_here

# RPC URL for your target network
RPC_URL=https://eth.llamarpc.com
```

### Option 2: Command-Line Flags

All options can be passed via CLI flags (see Usage below).

## Usage

### Basic Usage

```bash
# Mint 1 NFT
npm start -- --contract 0x1234567890abcdef1234567890abcdef12345678
```

### Full Usage Examples

```bash
# Mint 100 NFTs with custom batch size
npm start -- \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --quantity 100 \
  --batchSize 10 \
  --mintAmount 1

# Using .env for credentials, only specify contract
npm start -- --contract 0x1234567890abcdef1234567890abcdef12345678 --quantity 50

# Skip confirmation prompt (for automation)
npm start -- --contract 0x1234567890abcdef1234567890abcdef12345678 --quantity 25 --no-confirm

# Custom RPC URL (overrides .env)
npm start -- \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --rpc https://polygon-rpc.com \
  --quantity 10

# Specify gas limit manually
npm start -- \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --quantity 5 \
  --gasLimit 100000
```

### Command-Line Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--contract` | `-c` | NFT contract address (required) | - |
| `--quantity` | `-q` | Number of NFTs to mint | 1 |
| `--privateKey` | `-k` | Wallet private key | from .env |
| `--rpc` | `-r` | RPC URL | from .env |
| `--batchSize` | `-b` | Max transactions per batch | 10 |
| `--mintAmount` | `-m` | NFTs per mint call | 1 |
| `--gasLimit` | `-g` | Gas limit per transaction | auto |
| `--no-confirm` | - | Skip confirmation prompt | false |

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

- Ethereum Mainnet: `https://eth.llamarpc.com` or Alchemy/Infura
- Polygon: `https://polygon-rpc.com`
- Base: `https://base.llamarpc.com`
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- Optimism: `https://mainnet.optimism.io`
- Linea: `https://rpc.linea.build`

## Error Handling

The tool handles various error scenarios:

- **Invalid contract address**: Validates address format before connecting
- **Insufficient funds**: Checks wallet balance before starting
- **Network errors**: Provides clear error messages with suggestions
- **Transaction failures**: Offers option to continue with remaining batches
- **Contract incompatibility**: Lists supported mint function patterns

## Security Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- **Use a separate wallet** for minting - don't use your main wallet
- **Test first** on testnet before mainnet
- **Monitor gas prices** - use lower gas on testnets

## Troubleshooting

### "Contract does not support standard mint functions"

Some NFT contracts use custom minting functions. You may need to modify the ABI in `index.js` to match the specific contract's interface.

### "Insufficient funds"

Ensure your wallet has enough native tokens (ETH, MATIC, etc.) for gas fees.

### "RPC connection failed"

Check your RPC URL is correct and the network is operational.

## License

MIT

## Author

Deji-Tech
