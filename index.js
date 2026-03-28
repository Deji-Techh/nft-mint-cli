#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { Command } from 'commander';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const program = new Command();

program
  .name('nft-mint-bulk')
  .description('CLI tool for bulk NFT minting with batch processing')
  .version('1.0.0')
  .requiredOption('-c, --contract <address>', 'NFT contract address to mint from')
  .option('-q, --quantity <number>', 'Number of NFTs to mint (default: 1)', '1')
  .option('-k, --privateKey <key>', 'Ethereum wallet private key to sign transactions')
  .option('-r, --rpc <url>', 'RPC URL for the blockchain network')
  .option('-b, --batchSize <number>', 'Max NFTs per transaction (default: 10)', '10')
  .option('-m, --mintAmount <number>', 'Number of NFTs per mint call (default: 1)', '1')
  .option('-g, --gasLimit <number>', 'Gas limit per transaction (optional, auto-estimates if not set)')
  .option('--no-confirm', 'Skip confirmation prompt before minting')
  .parse(process.argv);

const options = program.opts();

function validateInputs() {
  const errors = [];

  if (!ethers.isAddress(options.contract)) {
    errors.push(chalk.red('✗ Invalid contract address provided'));
  }

  const quantity = parseInt(options.quantity);
  if (isNaN(quantity) || quantity < 1) {
    errors.push(chalk.red('✗ Quantity must be a positive number'));
  }

  const privateKey = options.privateKey || process.env.PRIVATE_KEY;
  if (!privateKey) {
    errors.push(chalk.red('✗ Private key is required (--privateKey or PRIVATE_KEY in .env)'));
  } else if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    errors.push(chalk.red('✗ Invalid private key format'));
  }

  const rpc = options.rpc || process.env.RPC_URL;
  if (!rpc) {
    errors.push(chalk.red('✗ RPC URL is required (--rpc or RPC_URL in .env)'));
  }

  if (errors.length > 0) {
    console.log(chalk.bold.red('\n❌ Validation Failed:\n'));
    errors.forEach(err => console.log(err));
    console.log('\n' + chalk.yellow('💡 Tip: Create a .env file with your configuration or use command-line flags\n'));
    process.exit(1);
  }

  return { privateKey, rpc, quantity };
}

function loadMintLog() {
  const logPath = path.join(process.cwd(), 'mint-log.json');
  if (fs.existsSync(logPath)) {
    try {
      return JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveMintLog(logs) {
  const logPath = path.join(process.cwd(), 'mint-log.json');
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

function addToMintLog(entry) {
  const logs = loadMintLog();
  logs.push(entry);
  saveMintLog(logs);
}

async function getContractMinter(wallet, contractAddress) {
  const abi = [
    "function mint(address _to, uint256 _quantity) external payable",
    "function mint(address _to) external payable",
    "function mint(uint256 _quantity) external payable",
    "function mint() external payable",
    "function safeMint(address _to) external",
    "function safeMint(address _to, uint256 _quantity) external",
    "function safeMint(address _to, uint256 _quantity, bytes _data) external",
    "function batchMint(address[] calldata _receivers) external"
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);
  return contract;
}

async function mintNFTs(contract, wallet, totalQuantity, batchSize, mintAmount, gasLimit) {
  const batches = Math.ceil(totalQuantity / mintAmount);
  const progressBar = new cliProgress.SingleBar({
    format: `${chalk.cyan('Minting Progress')} |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} batches`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(batches, 0);

  const logs = [];

  for (let i = 0; i < batches; i++) {
    const isLastBatch = i === batches - 1;
    const remaining = totalQuantity - (i * mintAmount);
    const currentMintAmount = isLastBatch && remaining < mintAmount ? remaining : mintAmount;

    try {
      let tx;
      const overrides = {};

      if (gasLimit) {
        overrides.gasLimit = gasLimit;
      }

      try {
        tx = await contract.mint(currentMintAmount, overrides);
      } catch {
        try {
          tx = await contract.mint(wallet.address, currentMintAmount, overrides);
        } catch {
          try {
            tx = await contract.mint(overrides);
          } catch (e) {
            throw new Error(`Contract does not support standard mint functions: ${e.message}`);
          }
        }
      }

      console.log(chalk.yellow(`\n📤 Transaction sent: ${tx.hash}`));

      const receipt = await tx.wait();

      const logEntry = {
        timestamp: new Date().toISOString(),
        batchNumber: i + 1,
        quantityMinted: currentMintAmount,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: wallet.address,
        contract: contract.target
      };

      logs.push(logEntry);
      addToMintLog(logEntry);

      console.log(chalk.green(`✓ Batch ${i + 1}/${batches} confirmed! (${currentMintAmount} NFTs)`));

    } catch (error) {
      console.log(chalk.red(`\n✗ Batch ${i + 1} failed: ${error.message}`));

      const errorLog = {
        timestamp: new Date().toISOString(),
        batchNumber: i + 1,
        quantityAttempted: currentMintAmount,
        error: error.message,
        status: 'failed',
        from: wallet.address,
        contract: contract.target
      };

      addToMintLog(errorLog);

      const continueWithConfirmation = await new Promise(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question(chalk.yellow('\n⚠️  Transaction failed. Continue with remaining batches? (y/N): '), (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === 'y');
        });
      });

      if (!continueWithConfirmation) {
        console.log(chalk.red('\n❌ Minting process aborted by user'));
        progressBar.stop();
        process.exit(1);
      }
    }

    progressBar.increment();
  }

  progressBar.stop();
  return logs;
}

async function main() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║         🚀 NFT Bulk Minting CLI - Production Ready        ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

  const { privateKey, rpc, quantity } = validateInputs();

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(chalk.blue('📋 Configuration:'));
  console.log(chalk.gray('────────────────────────────────────────'));
  console.log(chalk.white(`  Contract:     ${chalk.yellow(options.contract)}`));
  console.log(chalk.white(`  Quantity:     ${chalk.yellow(quantity)} NFTs`));
  console.log(chalk.white(`  Batch Size:   ${chalk.yellow(options.mintAmount)} per tx`));
  console.log(chalk.white(`  Wallet:       ${chalk.yellow(wallet.address)}`));
  console.log(chalk.white(`  Network:      ${chalk.yellow(rpc)}`));
  console.log(chalk.gray('────────────────────────────────────────\n'));

  try {
    const balance = await provider.getBalance(wallet.address);
    console.log(chalk.blue(`💰 Wallet Balance: ${chalk.yellow(ethers.formatEther(balance))} ETH\n`));

    if (balance === 0n) {
      console.log(chalk.red('❌ Error: Insufficient funds for gas fees. Please fund your wallet.\n'));
      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error connecting to network: ${error.message}\n`));
    process.exit(1);
  }

  if (!options.confirm) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmed = await new Promise(resolve => {
      rl.question(chalk.bold.yellow('\n⚠️  Ready to mint? This will send transactions to the blockchain. (y/N): '), (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });

    if (!confirmed) {
      console.log(chalk.yellow('\n👋 Minting cancelled by user.\n'));
      process.exit(0);
    }
  }

  console.log(chalk.bold.cyan('\n🔄 Connecting to contract...\n'));

  try {
    const contract = await getContractMinter(wallet, options.contract);

    console.log(chalk.green('✓ Connected to contract successfully!\n'));

    const mintAmount = parseInt(options.mintAmount);
    const gasLimit = options.gasLimit ? parseInt(options.gasLimit) : undefined;

    const logs = await mintNFTs(contract, wallet, quantity, parseInt(options.batchSize), mintAmount, gasLimit);

    console.log(chalk.bold.green('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.green('║                    ✅ MINTING COMPLETE                     ║'));
    console.log(chalk.bold.green('╚═══════════════════════════════════════════════════════════╝\n'));

    const successfulMints = logs.filter(l => l.status === 'success');
    const totalMinted = successfulMints.reduce((sum, l) => sum + l.quantityMinted, 0);
    const totalGas = successfulMints.reduce((sum, l) => sum + BigInt(l.gasUsed), 0n);

    console.log(chalk.blue('📊 Summary:'));
    console.log(chalk.gray('────────────────────────────────────────'));
    console.log(chalk.white(`  Total Batches:     ${chalk.yellow(logs.length)}`));
    console.log(chalk.white(`  Total NFTs Minted: ${chalk.yellow(totalMinted)}`));
    console.log(chalk.white(`  Total Gas Used:    ${chalk.yellow(totalGas.toString())} units`));
    console.log(chalk.gray('────────────────────────────────────────'));
    console.log(chalk.green(`\n📝 Logs saved to: ${chalk.yellow('mint-log.json')}\n`));

  } catch (error) {
    console.log(chalk.red(`\n❌ Fatal Error: ${error.message}\n`));

    addToMintLog({
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'fatal_error'
    });

    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red(`\n❌ Unexpected error: ${error.message}\n`));
  process.exit(1);
});
