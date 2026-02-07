import { ethers, JsonRpcProvider, Contract, formatUnits, parseUnits } from "ethers";

const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = "https://mainnet.base.org";

const MARKETPLACE_NFT_ADDRESS = "0x21Fb1fFaefA40c042276BB4Bcf8B826A647aE91E";
const MARKETPLACE_ESCROW_ADDRESS = "0x7e1868430e86304Aac93a8964c4a1D5C12A76ED5";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const MARKETPLACE_NFT_ABI = [
  "function mintAndTransfer(address to, string uri) external",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

const MARKETPLACE_ESCROW_ABI = [
  "function deposit(bytes32 orderId, address seller, uint256 amount, uint256 timeout, bool isNFT) external payable",
  "function release(bytes32 escrowId) external",
  "function dispute(bytes32 escrowId) external",
  "function refund(bytes32 escrowId) external",
  "event Deposited(bytes32 indexed escrowId, bytes32 indexed orderId, address depositor, address seller, uint256 amount)",
  "event Released(bytes32 indexed escrowId, address seller, uint256 amount)",
  "event Disputed(bytes32 indexed escrowId, address disputant)",
  "event Refunded(bytes32 indexed escrowId, address depositor, uint256 amount)",
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
      name: "base",
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
  try {
    const contract = getUSDCContract();
    const balance = await contract.balanceOf(address);
    return formatUnits(balance, 6);
  } catch (error: any) {
    console.error("Error getting USDC balance:", error.message);
    return "0";
  }
}

export async function getBaseBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return formatUnits(balance, 18);
  } catch (error: any) {
    console.error("Error getting ETH balance:", error.message);
    return "0";
  }
}

export async function getNFTsForOwner(address: string): Promise<string[]> {
  try {
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
  } catch (error: any) {
    console.error("Error getting NFTs for owner:", error.message);
    return [];
  }
}

export async function getEscrowDetails(escrowId: string): Promise<any> {
  try {
    const contract = getEscrowContract();
    const filter = contract.filters.Deposited(escrowId);
    const events = await contract.queryFilter(filter, 0, "latest");
    if (events.length === 0) return null;
    const lastEvent = events[events.length - 1];
    const parsed = contract.interface.parseLog({
      topics: lastEvent.topics as string[],
      data: lastEvent.data,
    });
    if (!parsed) return null;
    const releasedFilter = contract.filters.Released(escrowId);
    const releasedEvents = await contract.queryFilter(releasedFilter, 0, "latest");
    const disputedFilter = contract.filters.Disputed(escrowId);
    const disputedEvents = await contract.queryFilter(disputedFilter, 0, "latest");
    const refundedFilter = contract.filters.Refunded(escrowId);
    const refundedEvents = await contract.queryFilter(refundedFilter, 0, "latest");

    let status = "deposited";
    if (releasedEvents.length > 0) status = "released";
    if (disputedEvents.length > 0) status = "disputed";
    if (refundedEvents.length > 0) status = "refunded";

    return {
      escrowId,
      orderId: parsed.args.orderId,
      depositor: parsed.args.depositor,
      seller: parsed.args.seller,
      amount: formatUnits(parsed.args.amount, 6),
      status,
    };
  } catch (error: any) {
    console.error("Error getting escrow details:", error.message);
    return null;
  }
}

export function prepareEscrowDeposit(
  orderId: string,
  seller: string,
  amount: string,
  timeout: number = 86400
): { to: string; data: string; value: string; chainId: number } {
  try {
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
    };
  } catch (error: any) {
    console.error("Error preparing escrow deposit:", error.message);
    throw new Error("Failed to prepare escrow deposit transaction");
  }
}

export function prepareNFTMint(
  to: string,
  metadataUri: string
): { to: string; data: string; chainId: number } {
  try {
    const contract = getNFTContract();
    const data = contract.interface.encodeFunctionData("mintAndTransfer", [to, metadataUri]);
    return {
      to: MARKETPLACE_NFT_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
    };
  } catch (error: any) {
    console.error("Error preparing NFT mint:", error.message);
    throw new Error("Failed to prepare NFT mint transaction");
  }
}

export async function verifyTransaction(txHash: string): Promise<{
  success: boolean;
  blockNumber?: number;
  from?: string;
  to?: string;
  gasUsed?: string;
}> {
  try {
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
    };
  } catch (error: any) {
    console.error("Error verifying transaction:", error.message);
    return { success: false };
  }
}

export function formatUSDC(amount: string | number): string {
  return parseUnits(amount.toString(), 6).toString();
}

export function parseUSDC(amount: string | bigint): string {
  return formatUnits(amount, 6);
}

export {
  BASE_CHAIN_ID,
  MARKETPLACE_NFT_ADDRESS,
  MARKETPLACE_ESCROW_ADDRESS,
  USDC_ADDRESS,
};
