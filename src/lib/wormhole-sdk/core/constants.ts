/**
 * Core Constants for Wormhole Bridge Integration
 */

import { RouteType, type Network } from './types';

// ============================================================================
// Network Configuration
// ============================================================================

export const SUPPORTED_NETWORKS: Network[] = ['Mainnet', 'Testnet', 'Devnet'];

export const DEFAULT_NETWORK: Network = 'Mainnet';

// ============================================================================
// Route Priority & Configuration
// ============================================================================

/**
 * Default route priority order
 * Routes are tried in this order when finding the best route
 */
export const DEFAULT_ROUTE_PRIORITY: RouteType[] = [
  RouteType.AUTOMATIC_CCTP,        // Fastest for USDC - ~15 min with relayer
  RouteType.CCTP_MANUAL,            // Fast for USDC - ~15 min manual claim
  RouteType.TOKEN_BRIDGE_AUTO,      // Automatic with relayer
  RouteType.TOKEN_BRIDGE_MANUAL,    // Slowest - manual, no fees but takes days
];

/**
 * Route priority optimized for lowest cost
 */
export const CHEAPEST_ROUTE_PRIORITY: RouteType[] = [
  RouteType.CCTP_MANUAL,            // Free, manual claim
  RouteType.TOKEN_BRIDGE_MANUAL,    // Free, very slow
  RouteType.AUTOMATIC_CCTP,         // Has relay fee
  RouteType.TOKEN_BRIDGE_AUTO,      // Has relay fee
];

/**
 * Route priority optimized for speed
 */
export const FASTEST_ROUTE_PRIORITY: RouteType[] = [
  RouteType.AUTOMATIC_CCTP,         // ~15-20 min
  RouteType.CCTP_MANUAL,            // ~15-20 min (if claimed immediately)
  RouteType.TOKEN_BRIDGE_AUTO,      // Variable
  RouteType.TOKEN_BRIDGE_MANUAL,    // ~12+ days
];

// ============================================================================
// Route Metadata
// ============================================================================

export const ROUTE_METADATA = {
  [RouteType.AUTOMATIC_CCTP]: {
    name: 'Fast CCTP (Automatic)',
    description: 'Fastest delivery with automatic relayer - includes relay fee',
    averageTime: 15 * 60 * 1000, // 15 minutes in ms
    reliability: 'high' as const,
    requiresManualClaim: false,
    isAutomatic: true,
    supportedTokens: ['USDC'],
  },
  [RouteType.CCTP_MANUAL]: {
    name: 'Fast CCTP (Manual)',
    description: 'Fast delivery - requires manual claim on destination chain',
    averageTime: 15 * 60 * 1000, // 15 minutes in ms
    reliability: 'high' as const,
    requiresManualClaim: true,
    isAutomatic: false,
    supportedTokens: ['USDC'],
  },
  [RouteType.TOKEN_BRIDGE_AUTO]: {
    name: 'Token Bridge (Automatic)',
    description: 'Automatic delivery via Token Bridge - may take longer',
    averageTime: 60 * 60 * 1000, // 1 hour in ms (estimate)
    reliability: 'medium' as const,
    requiresManualClaim: false,
    isAutomatic: true,
    supportedTokens: ['*'], // All tokens
  },
  [RouteType.TOKEN_BRIDGE_MANUAL]: {
    name: 'Token Bridge (Manual)',
    description: 'Cheapest option - requires manual claim and takes ~12+ days',
    averageTime: 12 * 24 * 60 * 60 * 1000, // 12 days in ms
    reliability: 'medium' as const,
    requiresManualClaim: true,
    isAutomatic: false,
    supportedTokens: ['*'], // All tokens
  },
} as const;

// ============================================================================
// Timing Constants
// ============================================================================

export const TIMING = {
  // Quote expiration
  QUOTE_EXPIRATION_MS: 60 * 1000, // 1 minute

  // Transaction timeouts
  APPROVAL_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  TRANSFER_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
  ATTESTATION_TIMEOUT_MS: 60 * 60 * 1000, // 1 hour

  // Polling intervals
  TX_POLLING_INTERVAL_MS: 2 * 1000, // 2 seconds
  STATUS_POLLING_INTERVAL_MS: 5 * 1000, // 5 seconds

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // 1 second
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// Fee Constants
// ============================================================================

export const FEES = {
  // Slippage
  DEFAULT_SLIPPAGE_BPS: 100, // 1%
  MAX_SLIPPAGE_BPS: 500, // 5%
  MIN_SLIPPAGE_BPS: 10, // 0.1%

  // Gas buffer
  GAS_BUFFER_PERCENT: 20, // 20% buffer for gas estimation

  // Relay fee estimates (informational only)
  TYPICAL_RELAY_FEE_USDC: 0.5, // $0.50 typical
  MAX_RELAY_FEE_USDC: 2.0, // $2.00 maximum expected
} as const;

// ============================================================================
// Chain IDs
// ============================================================================

/**
 * EVM Chain IDs mapped to Wormhole chain names
 */
export const EVM_CHAIN_ID_TO_WORMHOLE_CHAIN: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BSC',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
  43114: 'Avalanche',
} as const;

/**
 * Wormhole chain names to EVM chain IDs
 */
export const WORMHOLE_CHAIN_TO_EVM_CHAIN_ID: Record<string, number> = {
  Ethereum: 1,
  Optimism: 10,
  BSC: 56,
  Polygon: 137,
  Base: 8453,
  Arbitrum: 42161,
  Avalanche: 43114,
} as const;

// ============================================================================
// URL Constants
// ============================================================================

export const URLS = {
  WORMHOLE_SCAN: 'https://wormholescan.io',
  WORMHOLE_DOCS: 'https://docs.wormhole.com',

  // Block explorers
  EXPLORERS: {
    Ethereum: 'https://etherscan.io',
    Optimism: 'https://optimistic.etherscan.io',
    BSC: 'https://bscscan.com',
    Polygon: 'https://polygonscan.com',
    Base: 'https://basescan.org',
    Arbitrum: 'https://arbiscan.io',
    Avalanche: 'https://snowtrace.io',
  },
} as const;

// ============================================================================
// Token Addresses
// ============================================================================

/**
 * Special address used to represent native tokens (ETH, MATIC, BNB, etc.)
 */
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

/**
 * Common USDC addresses across chains
 */
export const USDC_ADDRESSES: Record<string, string> = {
  Ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  Optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  BSC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  Polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  Base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  Arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  Avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to the correct network',
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  INSUFFICIENT_ALLOWANCE: 'Insufficient token allowance',
  QUOTE_EXPIRED: 'Quote has expired, please fetch a new quote',
  NO_ROUTES_FOUND: 'No routes available for this transfer',
  TRANSFER_FAILED: 'Transfer failed, please try again',
  APPROVAL_FAILED: 'Token approval failed',
  TX_REJECTED: 'Transaction was rejected',
  INVALID_AMOUNT: 'Invalid transfer amount',
  INVALID_ADDRESS: 'Invalid recipient address',
  CHAIN_NOT_SUPPORTED: 'Chain is not supported',
  TOKEN_NOT_SUPPORTED: 'Token is not supported on this route',
} as const;

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  // Minimum transfer amounts (to avoid dust)
  MIN_TRANSFER_AMOUNT_USD: 1, // $1 minimum

  // Maximum transfer amounts (for safety)
  MAX_TRANSFER_AMOUNT_USD: 1000000, // $1M maximum

  // Address validation
  EVM_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  SOLANA_ADDRESS_LENGTH: 44,

  // Amount validation
  MAX_DECIMALS: 18,
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  ENABLE_QUOTE_CACHING: true,
  ENABLE_TRANSACTION_TRACKING: true,
  ENABLE_ROUTE_COMPARISON: true,
  ENABLE_GAS_ESTIMATION: true,
  ENABLE_SLIPPAGE_PROTECTION: true,
  ENABLE_DEADLINE: true,
  ENABLE_METRICS: false,
} as const;

// ============================================================================
// Export All
// ============================================================================

export const WORMHOLE_CONSTANTS = {
  SUPPORTED_NETWORKS,
  DEFAULT_NETWORK,
  DEFAULT_ROUTE_PRIORITY,
  CHEAPEST_ROUTE_PRIORITY,
  FASTEST_ROUTE_PRIORITY,
  ROUTE_METADATA,
  TIMING,
  FEES,
  EVM_CHAIN_ID_TO_WORMHOLE_CHAIN,
  WORMHOLE_CHAIN_TO_EVM_CHAIN_ID,
  URLS,
  NATIVE_TOKEN_ADDRESS,
  USDC_ADDRESSES,
  ERROR_MESSAGES,
  VALIDATION,
  FEATURES,
} as const;
