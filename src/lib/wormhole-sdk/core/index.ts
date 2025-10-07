/**
 * Wormhole Bridge SDK - Core Module
 *
 * Framework-agnostic types, constants, and utilities for Wormhole bridge integration
 *
 * @module core
 */

// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Export all errors
export * from './errors';

// Re-export commonly used items for convenience
export {
  type Chain,
  type Token,
  type Route,
  type BridgeQuote,
  type TransferParams,
  type TransferReceipt,
  type TransferStatus,
  type WormholeSigner,
  RouteType,
  TransferStatus as TransferStatusEnum,
  WormholeErrorCode,
} from './types';

export {
  WORMHOLE_CONSTANTS,
  DEFAULT_ROUTE_PRIORITY,
  ROUTE_METADATA,
  NATIVE_TOKEN_ADDRESS,
  ERROR_MESSAGES,
} from './constants';

export {
  WormholeError,
  QuoteFailedError,
  TransferFailedError,
  WalletNotConnectedError,
  isWormholeError,
  formatErrorForUser,
} from './errors';
