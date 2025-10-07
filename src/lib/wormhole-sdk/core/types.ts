/**
 * Core Type Definitions for Wormhole Bridge Integration
 *
 * Framework-agnostic types that can be used across any JavaScript/TypeScript project
 */

// ============================================================================
// Chain & Network Types
// ============================================================================

export interface Chain {
  id: number;
  name: string;
  nativeCurrency: string;
  wormholeChainId?: number;
  rpcUrl?: string;
  blockExplorer?: string;
}

export type Network = 'Mainnet' | 'Testnet' | 'Devnet';

export type ChainName =
  | 'Ethereum'
  | 'Polygon'
  | 'Arbitrum'
  | 'Optimism'
  | 'Base'
  | 'BSC'
  | 'Avalanche'
  | 'Solana'
  | 'Sui'
  | 'Aptos';

// ============================================================================
// Token Types
// ============================================================================

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name?: string;
  logoURI?: string;
}

export interface TokenAmount {
  token: Token;
  amount: {
    amount: string;
    decimals: number;
  };
}

export interface NativeToken extends Omit<Token, 'address'> {
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  isNative: true;
}

// ============================================================================
// Route Types
// ============================================================================

export enum RouteType {
  AUTOMATIC_CCTP = 'AutomaticCCTPRoute',
  CCTP_MANUAL = 'CCTPRoute',
  TOKEN_BRIDGE_AUTO = 'AutomaticTokenBridgeRoute',
  TOKEN_BRIDGE_MANUAL = 'TokenBridgeRoute',
}

export interface Route {
  type: RouteType;
  name: string;
  description: string;
  estimatedTime: number; // milliseconds
  relayFee?: TokenAmount;
  isAutomatic: boolean;
  requiresManualClaim: boolean;
  reliability?: 'high' | 'medium' | 'low';
}

export interface RouteComparison {
  route: Route;
  quote: BridgeQuote;
  score: number;
  pros: string[];
  cons: string[];
}

// ============================================================================
// Quote Types
// ============================================================================

export interface BridgeQuote {
  sourceToken: TokenAmount;
  destinationToken: TokenAmount;
  route: Route;
  relayFee?: TokenAmount;
  eta: number; // milliseconds
  gasFee?: TokenAmount;
  success: boolean;
  error?: string;
  timestamp?: number;
}

export interface QuoteRequest {
  sourceChain: ChainName | string;
  destChain: ChainName | string;
  token: Token;
  amount: string;
  senderAddress: string;
  recipientAddress: string;
  routeType?: RouteType;
}

// ============================================================================
// Transfer Types
// ============================================================================

export interface TransferParams {
  sourceChain: ChainName | string;
  destChain: ChainName | string;
  token: Token;
  amount: string;
  senderAddress: string;
  recipientAddress: string;
  route?: Route;
  slippage?: number; // basis points (100 = 1%)
  deadline?: number; // unix timestamp
}

export interface TransferReceipt {
  txHash: string;
  originTxs: TransactionReference[];
  destinationTx?: TransactionReference;
  route: Route;
  wormholeScanUrl: string;
  blockExplorerUrl: string;
  status: TransferStatus;
  timestamp: number;
}

export interface TransactionReference {
  txid: string;
  chain: ChainName | string;
  blockNumber?: number;
  timestamp?: number;
}

export enum TransferStatus {
  PENDING = 'pending',
  APPROVING = 'approving',
  APPROVED = 'approved',
  TRANSFERRING = 'transferring',
  RELAYING = 'relaying',
  ATTESTING = 'attesting',
  CLAIMING = 'claiming',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface TransferProgress {
  status: TransferStatus;
  message: string;
  txHash?: string;
  percentage?: number; // 0-100
  estimatedTimeRemaining?: number; // milliseconds
}

// ============================================================================
// Signer Types
// ============================================================================

export interface WormholeSigner {
  chain(): string;
  address(): string;
  signAndSend(txns: UnsignedTransaction[]): Promise<string[]>;
}

export interface UnsignedTransaction {
  transaction: {
    to: string;
    data: string;
    value?: bigint;
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
  };
  description: string;
  parallelizable?: boolean;
}

export interface FeeData {
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface WormholeConfig {
  network: Network;
  rpcUrls?: Record<string, string>;
  debug?: boolean;
  timeout?: number; // milliseconds
  retries?: number;
}

export interface BridgeConfig extends WormholeConfig {
  preferredRoutes?: RouteType[];
  maxSlippage?: number; // basis points
  autoApprove?: boolean;
  trackTransfers?: boolean;
}

// ============================================================================
// Service Interface Types
// ============================================================================

export interface IBridgeService {
  initialize(config: BridgeConfig): Promise<void>;
  getQuote(request: QuoteRequest): Promise<BridgeQuote>;
  getAllRoutes(request: QuoteRequest): Promise<Route[]>;
  compareRoutes(routes: Route[], request: QuoteRequest): Promise<RouteComparison[]>;
  executeTransfer(params: TransferParams, walletClient: any): Promise<TransferReceipt>;
  trackTransfer(txHash: string): Promise<TransferProgress>;
}

export interface IQuoteService {
  getQuote(request: QuoteRequest): Promise<BridgeQuote>;
  getQuoteForRoute(request: QuoteRequest, route: Route): Promise<BridgeQuote>;
  getAllQuotes(request: QuoteRequest): Promise<BridgeQuote[]>;
  getCheapestRoute(routes: Route[]): Route | null;
  getFastestRoute(routes: Route[]): Route | null;
  compareRoutes(routes: Route[]): RouteComparison[];
}

export interface ITransferService {
  initiateTransfer(
    params: TransferParams,
    signer: WormholeSigner,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<TransferReceipt>;

  waitForCompletion(receipt: TransferReceipt): Promise<void>;

  claimOnDestination(receipt: TransferReceipt, signer: WormholeSigner): Promise<string>;
}

export interface ISignerAdapter {
  createSigner(walletClient: any, chainName: string): Promise<WormholeSigner>;
  getFeeData(chainName: string): Promise<FeeData>;
  getNonce(address: string, chainName: string): Promise<number>;
  estimateGas(transaction: UnsignedTransaction, chainName: string): Promise<bigint>;
}

// ============================================================================
// Error Types
// ============================================================================

export class WormholeError extends Error {
  constructor(
    message: string,
    public code: WormholeErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'WormholeError';
  }
}

export enum WormholeErrorCode {
  // Configuration Errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',

  // Chain Errors
  CHAIN_NOT_FOUND = 'CHAIN_NOT_FOUND',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',

  // Token Errors
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  INVALID_TOKEN_ADDRESS = 'INVALID_TOKEN_ADDRESS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',

  // Route Errors
  NO_ROUTES_FOUND = 'NO_ROUTES_FOUND',
  ROUTE_VALIDATION_FAILED = 'ROUTE_VALIDATION_FAILED',

  // Quote Errors
  QUOTE_FAILED = 'QUOTE_FAILED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',

  // Transfer Errors
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  APPROVAL_FAILED = 'APPROVAL_FAILED',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',

  // Transaction Errors
  TX_REJECTED = 'TX_REJECTED',
  TX_TIMEOUT = 'TX_TIMEOUT',
  TX_FAILED = 'TX_FAILED',

  // Wallet Errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_WRONG_NETWORK = 'WALLET_WRONG_NETWORK',

  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Event Types
// ============================================================================

export interface BridgeEvent {
  type: BridgeEventType;
  timestamp: number;
  data: any;
}

export enum BridgeEventType {
  QUOTE_FETCHED = 'quote_fetched',
  TRANSFER_INITIATED = 'transfer_initiated',
  APPROVAL_STARTED = 'approval_started',
  APPROVAL_CONFIRMED = 'approval_confirmed',
  TRANSFER_STARTED = 'transfer_started',
  TRANSFER_CONFIRMED = 'transfer_confirmed',
  ATTESTATION_RECEIVED = 'attestation_received',
  CLAIM_STARTED = 'claim_started',
  CLAIM_CONFIRMED = 'claim_confirmed',
  TRANSFER_COMPLETED = 'transfer_completed',
  ERROR_OCCURRED = 'error_occurred',
}

// ============================================================================
// Utility Types
// ============================================================================

export type Awaitable<T> = T | Promise<T>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// Type Guards
// ============================================================================

export function isNativeToken(token: Token): token is NativeToken {
  return token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
}

export function isAutomaticRoute(route: Route): boolean {
  return route.isAutomatic;
}

export function isManualRoute(route: Route): boolean {
  return !route.isAutomatic;
}

export function hasRelayFee(quote: BridgeQuote): boolean {
  return quote.relayFee !== undefined && quote.relayFee !== null;
}

export function isTransferComplete(status: TransferStatus): boolean {
  return status === TransferStatus.COMPLETED;
}

export function isTransferPending(status: TransferStatus): boolean {
  return [
    TransferStatus.PENDING,
    TransferStatus.APPROVING,
    TransferStatus.TRANSFERRING,
    TransferStatus.RELAYING,
    TransferStatus.ATTESTING,
    TransferStatus.CLAIMING,
  ].includes(status);
}

export function isTransferFailed(status: TransferStatus): boolean {
  return [TransferStatus.FAILED, TransferStatus.CANCELLED].includes(status);
}

// ============================================================================
// Constants
// ============================================================================

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

export const DEFAULT_SLIPPAGE = 100; // 1% in basis points

export const DEFAULT_DEADLINE_MINUTES = 30;

export const WORMHOLE_SCAN_BASE_URL = 'https://wormholescan.io' as const;
