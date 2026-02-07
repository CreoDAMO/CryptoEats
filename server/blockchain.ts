import { ethers, JsonRpcProvider, Contract, formatUnits, parseUnits } from "ethers";

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

const NETWORK = process.env.BASE_NETWORK === "sepolia" ? "sepolia" : "mainnet";
const BASE_CHAIN_ID = NETWORK === "sepolia" ? BASE_SEPOLIA_CHAIN_ID : BASE_MAINNET_CHAIN_ID;
const BASE_RPC_URL = NETWORK === "sepolia"
  ? "https://sepolia.base.org"
  : "https://mainnet.base.org";

const MARKETPLACE_NFT_ADDRESS = "0x21Fb1fFaefA40c042276BB4Bcf8B826A647aE91E";
const MARKETPLACE_ESCROW_ADDRESS = "0x7e1868430e86304Aac93a8964c4a1D5C12A76ED5";
const USDC_ADDRESS = NETWORK === "sepolia"
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_PAYMASTER_ADDRESS = "0x2FAEB0760D4230Ef2aC21496Bb4F0b47D634FD4c";

const CONTRACT_ALLOWLIST: Record<string, { name: string; type: "escrow" | "nft" | "token"; sponsoredGas: boolean }> = {
  [MARKETPLACE_ESCROW_ADDRESS.toLowerCase()]: {
    name: "CryptoEats Escrow",
    type: "escrow",
    sponsoredGas: true,
  },
  [MARKETPLACE_NFT_ADDRESS.toLowerCase()]: {
    name: "CryptoEats NFT Rewards",
    type: "nft",
    sponsoredGas: true,
  },
  [USDC_ADDRESS.toLowerCase()]: {
    name: "USDC on Base",
    type: "token",
    sponsoredGas: true,
  },
};

export enum PaymasterErrorCode {
  INTERNAL_ERROR = -32000,
  POLICY_REJECTED = -32001,
  GAS_ESTIMATION_FAILED = -32002,
  PAYMENT_REQUIRED = 402,
  UNAUTHORIZED = 401,
  SIMULATION_FAILED = -32003,
  RATE_LIMITED = 429,
  UNKNOWN = -1,
}

export interface PaymasterError {
  code: PaymasterErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestion?: string;
}

export function classifyPaymasterError(error: any): PaymasterError {
  const msg = (error?.message || error?.reason || "").toLowerCase();
  const code = error?.code || error?.status;

  if (code === -32000 || msg.includes("internal error") || msg.includes("internal_error")) {
    return {
      code: PaymasterErrorCode.INTERNAL_ERROR,
      message: error.message || "Internal Paymaster service error",
      userMessage: "The gas sponsorship service is temporarily unavailable. Your transaction will be retried automatically.",
      retryable: true,
      suggestion: "This is usually a temporary issue with Coinbase's Paymaster service. Wait a moment and try again.",
    };
  }

  if (msg.includes("rejected by policy") || msg.includes("policy") || msg.includes("spend limit") || msg.includes("attestation")) {
    return {
      code: PaymasterErrorCode.POLICY_REJECTED,
      message: error.message || "Transaction rejected by Paymaster policy",
      userMessage: "This transaction couldn't be sponsored. The contract or amount may not be eligible for gasless transactions.",
      retryable: false,
      suggestion: "Check that the contract is allowlisted in CDP Portal and spend limits haven't been exceeded.",
    };
  }

  if (msg.includes("estimate gas") || msg.includes("gas estimation") || msg.includes("revert") || msg.includes("execution reverted")) {
    return {
      code: PaymasterErrorCode.GAS_ESTIMATION_FAILED,
      message: error.message || "Unable to estimate gas for transaction",
      userMessage: "This transaction can't be processed right now. The contract call may have invalid parameters.",
      retryable: false,
      suggestion: "Verify the contract call data is correctly encoded. Check ABI encoding and parameter types.",
    };
  }

  if (code === 402 || msg.includes("payment required") || msg.includes("payment-signature")) {
    return {
      code: PaymasterErrorCode.PAYMENT_REQUIRED,
      message: error.message || "Payment required by Paymaster",
      userMessage: "A payment verification is needed to complete this transaction. Please check your USDC balance.",
      retryable: false,
      suggestion: "Verify the PAYMENT-SIGNATURE header and USDC balance for required payment.",
    };
  }

  if (code === 401 || msg.includes("unauthorized") || msg.includes("invalid api key")) {
    return {
      code: PaymasterErrorCode.UNAUTHORIZED,
      message: error.message || "Unauthorized access to Paymaster",
      userMessage: "There's a configuration issue with the gas sponsorship service. Please try again later.",
      retryable: false,
      suggestion: "Verify the CDP API key in the Paymaster URL is valid and has the correct permissions.",
    };
  }

  if (code === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return {
      code: PaymasterErrorCode.RATE_LIMITED,
      message: error.message || "Rate limited by Paymaster",
      userMessage: "Too many transactions in a short period. Please wait a moment before trying again.",
      retryable: true,
      suggestion: "Implement exponential backoff. Consider batching operations to reduce request volume.",
    };
  }

  if (msg.includes("loads indefinitely") || msg.includes("cancels") || msg.includes("custom rpc")) {
    return {
      code: PaymasterErrorCode.SIMULATION_FAILED,
      message: error.message || "Gasless transaction failed with custom RPC",
      userMessage: "The gasless transaction couldn't complete. Falling back to standard transaction.",
      retryable: true,
      suggestion: "Ensure useCdpPaymaster: true is set. Try switching to official Base Paymaster sponsor.",
    };
  }

  return {
    code: PaymasterErrorCode.UNKNOWN,
    message: error.message || "Unknown blockchain error",
    userMessage: "Something went wrong with the transaction. Please try again.",
    retryable: true,
    suggestion: "Check CDP Portal logs for more details.",
  };
}

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: PaymasterError) => void;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000, onRetry } = options;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const classified = classifyPaymasterError(error);

      if (!classified.retryable || attempt === maxRetries) {
        throw Object.assign(error, { paymasterError: classified });
      }

      const jitter = Math.random() * 500;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);

      if (onRetry) {
        onRetry(attempt + 1, classified);
      } else {
        console.warn(`[Blockchain] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${classified.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function validateChainId(chainId: number): { valid: boolean; network: string; error?: string } {
  if (chainId === BASE_MAINNET_CHAIN_ID) {
    return { valid: true, network: "Base Mainnet" };
  }
  if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return { valid: true, network: "Base Sepolia" };
  }
  return {
    valid: false,
    network: "Unknown",
    error: `Invalid chain ID: ${chainId}. Expected ${BASE_MAINNET_CHAIN_ID} (Base Mainnet) or ${BASE_SEPOLIA_CHAIN_ID} (Base Sepolia).`,
  };
}

export function isContractAllowlisted(address: string): boolean {
  return address.toLowerCase() in CONTRACT_ALLOWLIST;
}

export function getContractInfo(address: string) {
  return CONTRACT_ALLOWLIST[address.toLowerCase()] || null;
}

export function getAllowlistedContracts() {
  return Object.entries(CONTRACT_ALLOWLIST).map(([address, info]) => ({
    address,
    ...info,
  }));
}

export function isGasSponsored(contractAddress: string): boolean {
  const info = getContractInfo(contractAddress);
  return info?.sponsoredGas === true;
}

const MARKETPLACE_NFT_ABI = [
  "function mintAndTransfer(bytes32 orderId, address creator, address to, string tokenURI, uint256 royaltyBps_) external returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)",
  "function updateEscrow(address newEscrow) external",
  "function creatorOf(uint256 tokenId) external view returns (address)",
  "function royaltyBps(uint256 tokenId) external view returns (uint256)",
  "function escrowContract() external view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Minted(uint256 indexed tokenId, address indexed creator, bytes32 indexed orderId)",
  "event EscrowUpdated(address indexed newEscrow)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

const MARKETPLACE_ESCROW_ABI = [
  "function deposit(bytes32 orderId, address seller, uint256 amount, uint256 timeout, bool isNFT) external",
  "function release(bytes32 orderId) external",
  "function dispute(bytes32 orderId) external",
  "function adminRefund(bytes32 orderId) external",
  "function updateFee(uint256 newBps) external",
  "function updateFeeRecipient(address newRecipient) external",
  "function escrows(bytes32 orderId) external view returns (address buyer, address seller, uint256 amount, uint256 timeout, uint8 status)",
  "function paymentToken() external view returns (address)",
  "function nftContract() external view returns (address)",
  "function platformFeeBps() external view returns (uint256)",
  "function feeRecipient() external view returns (address)",
  "event Deposited(bytes32 indexed orderId, address indexed buyer, uint256 amount)",
  "event Released(bytes32 indexed orderId, address indexed seller, uint256 payout, uint256 fee)",
  "event Disputed(bytes32 indexed orderId)",
  "event Refunded(bytes32 indexed orderId, address indexed buyer, uint256 amount)",
];

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

let providerInstance: JsonRpcProvider | null = null;

export function getProvider(): JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new JsonRpcProvider(BASE_RPC_URL, {
      chainId: BASE_CHAIN_ID,
      name: NETWORK === "sepolia" ? "base-sepolia" : "base",
    });
  }
  return providerInstance;
}

function getNFTContract(): Contract {
  return new Contract(MARKETPLACE_NFT_ADDRESS, MARKETPLACE_NFT_ABI, getProvider());
}

function getEscrowContract(): Contract {
  return new Contract(MARKETPLACE_ESCROW_ADDRESS, MARKETPLACE_ESCROW_ABI, getProvider());
}

function getUSDCContract(): Contract {
  return new Contract(USDC_ADDRESS, USDC_ABI, getProvider());
}

export async function getUSDCBalance(address: string): Promise<string> {
  return withRetry(async () => {
    const contract = getUSDCContract();
    const balance = await contract.balanceOf(address);
    return formatUnits(balance, 6);
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[USDC Balance] Retry ${attempt}: ${err.message}`),
  }).catch((error: any) => {
    console.error("Error getting USDC balance:", error.message);
    return "0";
  });
}

export async function getBaseBalance(address: string): Promise<string> {
  return withRetry(async () => {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return formatUnits(balance, 18);
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[ETH Balance] Retry ${attempt}: ${err.message}`),
  }).catch((error: any) => {
    console.error("Error getting ETH balance:", error.message);
    return "0";
  });
}

export async function getNFTsForOwner(address: string): Promise<string[]> {
  return withRetry(async () => {
    const contract = getNFTContract();
    const filter = contract.filters.Transfer(null, address);
    const events = await contract.queryFilter(filter, 0, "latest");
    const tokenIds = new Set<string>();
    for (const event of events) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsed) {
        tokenIds.add(parsed.args.tokenId.toString());
      }
    }
    const transferOutFilter = contract.filters.Transfer(address, null);
    const outEvents = await contract.queryFilter(transferOutFilter, 0, "latest");
    for (const event of outEvents) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsed) {
        tokenIds.delete(parsed.args.tokenId.toString());
      }
    }
    return Array.from(tokenIds);
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[NFTs] Retry ${attempt}: ${err.message}`),
  }).catch((error: any) => {
    console.error("Error getting NFTs for owner:", error.message);
    return [];
  });
}

const ESCROW_STATUS_MAP: Record<number, string> = {
  0: "none",
  1: "deposited",
  2: "disputed",
  3: "released",
  4: "refunded",
};

export async function getEscrowDetails(orderId: string): Promise<any> {
  return withRetry(async () => {
    const contract = getEscrowContract();
    const orderIdBytes = ethers.id(orderId);
    const escrow = await contract.escrows(orderIdBytes);
    if (!escrow || escrow.buyer === ethers.ZeroAddress) return null;

    return {
      orderId,
      orderIdBytes: orderIdBytes,
      buyer: escrow.buyer,
      seller: escrow.seller,
      amount: formatUnits(escrow.amount, 6),
      timeout: Number(escrow.timeout),
      status: ESCROW_STATUS_MAP[Number(escrow.status)] || "unknown",
    };
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[Escrow] Retry ${attempt}: ${err.message}`),
  }).catch((error: any) => {
    console.error("Error getting escrow details:", error.message);
    return null;
  });
}

export function prepareEscrowDeposit(
  orderId: string,
  seller: string,
  amount: string,
  timeout: number = 86400
): { to: string; data: string; value: string; chainId: number; gasSponsored: boolean; contractName: string } {
  try {
    if (!isContractAllowlisted(MARKETPLACE_ESCROW_ADDRESS)) {
      throw new Error("Escrow contract is not in the allowlist");
    }
    const contract = getEscrowContract();
    const orderIdBytes = ethers.id(orderId);
    const amountInUnits = parseUnits(amount, 6);
    const data = contract.interface.encodeFunctionData("deposit", [
      orderIdBytes,
      seller,
      amountInUnits,
      timeout,
      false,
    ]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      value: "0",
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS),
      contractName: "CryptoEats Escrow",
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    console.error("Error preparing escrow deposit:", classified.message);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}

export function prepareEscrowRelease(
  orderId: string
): { to: string; data: string; chainId: number; gasSponsored: boolean } {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("release", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS),
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}

export function prepareEscrowDispute(
  orderId: string
): { to: string; data: string; chainId: number; gasSponsored: boolean } {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("dispute", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS),
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}

export function prepareAdminRefund(
  orderId: string
): { to: string; data: string; chainId: number; gasSponsored: boolean } {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("adminRefund", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS),
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}

export function prepareNFTMint(
  orderId: string,
  creator: string,
  to: string,
  metadataUri: string,
  royaltyBps: number = 250
): { to: string; data: string; chainId: number; gasSponsored: boolean; contractName: string } {
  try {
    if (!isContractAllowlisted(MARKETPLACE_NFT_ADDRESS)) {
      throw new Error("NFT contract is not in the allowlist");
    }
    const contract = getNFTContract();
    const orderIdBytes = ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("mintAndTransfer", [
      orderIdBytes,
      creator,
      to,
      metadataUri,
      royaltyBps,
    ]);
    return {
      to: MARKETPLACE_NFT_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_NFT_ADDRESS),
      contractName: "CryptoEats NFT Rewards",
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    console.error("Error preparing NFT mint:", classified.message);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}

export async function estimateGas(
  from: string,
  to: string,
  data: string,
  value: string = "0"
): Promise<{ gasEstimate: string; gasSponsored: boolean; error?: string }> {
  try {
    const provider = getProvider();
    const sponsored = isGasSponsored(to);
    const estimate = await provider.estimateGas({ from, to, data, value: value === "0" ? undefined : value });
    return {
      gasEstimate: estimate.toString(),
      gasSponsored: sponsored,
    };
  } catch (error: any) {
    const classified = classifyPaymasterError(error);
    return {
      gasEstimate: "0",
      gasSponsored: false,
      error: classified.userMessage,
    };
  }
}

export async function verifyTransaction(txHash: string): Promise<{
  success: boolean;
  blockNumber?: number;
  from?: string;
  to?: string;
  gasUsed?: string;
  chainId?: number;
  error?: PaymasterError;
}> {
  return withRetry(async () => {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { success: false };
    }
    return {
      success: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to || undefined,
      gasUsed: receipt.gasUsed.toString(),
      chainId: BASE_CHAIN_ID,
    };
  }, {
    maxRetries: 3,
    baseDelayMs: 2000,
    onRetry: (attempt, err) => console.warn(`[Verify Tx] Retry ${attempt}: ${err.message}`),
  }).catch((error: any) => {
    const classified = classifyPaymasterError(error);
    console.error("Error verifying transaction:", classified.message);
    return { success: false, error: classified };
  });
}

export function getPaymasterStatus() {
  return {
    network: NETWORK,
    chainId: BASE_CHAIN_ID,
    rpcUrl: BASE_RPC_URL,
    paymasterAddress: BASE_PAYMASTER_ADDRESS,
    sponsoredContracts: getAllowlistedContracts(),
    supportedChains: [
      { chainId: BASE_MAINNET_CHAIN_ID, name: "Base Mainnet", rpcUrl: "https://mainnet.base.org" },
      { chainId: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia (Testnet)", rpcUrl: "https://sepolia.base.org" },
    ],
    gasPolicy: {
      usdcTransfers: "sponsored",
      escrowDeposits: "sponsored",
      escrowReleases: "sponsored",
      nftMints: "sponsored",
      otherContracts: "user-paid",
    },
  };
}

export function formatUSDC(amount: string | number): string {
  return parseUnits(amount.toString(), 6).toString();
}

export function parseUSDC(amount: string | bigint): string {
  return formatUnits(amount, 6);
}

export {
  BASE_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  MARKETPLACE_NFT_ADDRESS,
  MARKETPLACE_ESCROW_ADDRESS,
  USDC_ADDRESS,
  BASE_PAYMASTER_ADDRESS,
  ESCROW_STATUS_MAP,
};
