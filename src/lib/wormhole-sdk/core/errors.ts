/**
 * Custom Error Classes for Wormhole Bridge Integration
 *
 * Provides structured error handling with error codes and additional context
 */

import { WormholeErrorCode } from './types';

// ============================================================================
// Base Error Class
// ============================================================================

export class WormholeError extends Error {
  public readonly code: WormholeErrorCode;
  public readonly details?: any;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: WormholeErrorCode = WormholeErrorCode.UNKNOWN_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'WormholeError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ============================================================================
// Configuration Errors
// ============================================================================

export class InvalidConfigError extends WormholeError {
  constructor(message: string, details?: any) {
    super(message, WormholeErrorCode.INVALID_CONFIG, details);
    this.name = 'InvalidConfigError';
  }
}

export class NetworkNotSupportedError extends WormholeError {
  constructor(network: string, details?: any) {
    super(`Network '${network}' is not supported`, WormholeErrorCode.NETWORK_NOT_SUPPORTED, details);
    this.name = 'NetworkNotSupportedError';
  }
}

// ============================================================================
// Chain Errors
// ============================================================================

export class ChainNotFoundError extends WormholeError {
  constructor(chainIdentifier: string | number, details?: any) {
    super(`Chain '${chainIdentifier}' not found`, WormholeErrorCode.CHAIN_NOT_FOUND, details);
    this.name = 'ChainNotFoundError';
  }
}

export class ChainNotSupportedError extends WormholeError {
  constructor(chain: string, details?: any) {
    super(`Chain '${chain}' is not supported`, WormholeErrorCode.CHAIN_NOT_SUPPORTED, details);
    this.name = 'ChainNotSupportedError';
  }
}

// ============================================================================
// Token Errors
// ============================================================================

export class TokenNotFoundError extends WormholeError {
  constructor(tokenIdentifier: string, details?: any) {
    super(`Token '${tokenIdentifier}' not found`, WormholeErrorCode.TOKEN_NOT_FOUND, details);
    this.name = 'TokenNotFoundError';
  }
}

export class InvalidTokenAddressError extends WormholeError {
  constructor(address: string, details?: any) {
    super(`Invalid token address: ${address}`, WormholeErrorCode.INVALID_TOKEN_ADDRESS, details);
    this.name = 'InvalidTokenAddressError';
  }
}

export class InsufficientBalanceError extends WormholeError {
  constructor(
    public readonly required: string,
    public readonly available: string,
    public readonly token: string,
    details?: any
  ) {
    super(
      `Insufficient ${token} balance. Required: ${required}, Available: ${available}`,
      WormholeErrorCode.INSUFFICIENT_BALANCE,
      details
    );
    this.name = 'InsufficientBalanceError';
  }
}

// ============================================================================
// Route Errors
// ============================================================================

export class NoRoutesFoundError extends WormholeError {
  constructor(details?: any) {
    super('No routes found for this transfer', WormholeErrorCode.NO_ROUTES_FOUND, details);
    this.name = 'NoRoutesFoundError';
  }
}

export class RouteValidationFailedError extends WormholeError {
  constructor(routeName: string, reason: string, details?: any) {
    super(
      `Route validation failed for ${routeName}: ${reason}`,
      WormholeErrorCode.ROUTE_VALIDATION_FAILED,
      details
    );
    this.name = 'RouteValidationFailedError';
  }
}

// ============================================================================
// Quote Errors
// ============================================================================

export class QuoteFailedError extends WormholeError {
  constructor(reason: string, details?: any) {
    super(`Failed to get quote: ${reason}`, WormholeErrorCode.QUOTE_FAILED, details);
    this.name = 'QuoteFailedError';
  }
}

export class QuoteExpiredError extends WormholeError {
  constructor(details?: any) {
    super('Quote has expired, please fetch a new quote', WormholeErrorCode.QUOTE_EXPIRED, details);
    this.name = 'QuoteExpiredError';
  }
}

// ============================================================================
// Transfer Errors
// ============================================================================

export class TransferFailedError extends WormholeError {
  constructor(reason: string, details?: any) {
    super(`Transfer failed: ${reason}`, WormholeErrorCode.TRANSFER_FAILED, details);
    this.name = 'TransferFailedError';
  }
}

export class ApprovalFailedError extends WormholeError {
  constructor(reason: string, details?: any) {
    super(`Token approval failed: ${reason}`, WormholeErrorCode.APPROVAL_FAILED, details);
    this.name = 'ApprovalFailedError';
  }
}

export class InsufficientAllowanceError extends WormholeError {
  constructor(
    public readonly required: string,
    public readonly current: string,
    public readonly token: string,
    details?: any
  ) {
    super(
      `Insufficient ${token} allowance. Required: ${required}, Current: ${current}`,
      WormholeErrorCode.INSUFFICIENT_ALLOWANCE,
      details
    );
    this.name = 'InsufficientAllowanceError';
  }
}

// ============================================================================
// Transaction Errors
// ============================================================================

export class TransactionRejectedError extends WormholeError {
  constructor(details?: any) {
    super('Transaction was rejected by user', WormholeErrorCode.TX_REJECTED, details);
    this.name = 'TransactionRejectedError';
  }
}

export class TransactionTimeoutError extends WormholeError {
  constructor(txHash?: string, details?: any) {
    super(
      txHash ? `Transaction ${txHash} timed out` : 'Transaction timed out',
      WormholeErrorCode.TX_TIMEOUT,
      details
    );
    this.name = 'TransactionTimeoutError';
  }
}

export class TransactionFailedError extends WormholeError {
  constructor(txHash: string, reason?: string, details?: any) {
    super(
      reason ? `Transaction ${txHash} failed: ${reason}` : `Transaction ${txHash} failed`,
      WormholeErrorCode.TX_FAILED,
      details
    );
    this.name = 'TransactionFailedError';
  }
}

// ============================================================================
// Wallet Errors
// ============================================================================

export class WalletNotConnectedError extends WormholeError {
  constructor(details?: any) {
    super('Wallet is not connected', WormholeErrorCode.WALLET_NOT_CONNECTED, details);
    this.name = 'WalletNotConnectedError';
  }
}

export class WalletWrongNetworkError extends WormholeError {
  constructor(
    public readonly expected: string,
    public readonly actual: string,
    details?: any
  ) {
    super(
      `Wallet is on wrong network. Expected: ${expected}, Actual: ${actual}`,
      WormholeErrorCode.WALLET_WRONG_NETWORK,
      details
    );
    this.name = 'WalletWrongNetworkError';
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if an error is a WormholeError
 */
export function isWormholeError(error: unknown): error is WormholeError {
  return error instanceof WormholeError;
}

/**
 * Check if an error has a specific error code
 */
export function hasErrorCode(error: unknown, code: WormholeErrorCode): boolean {
  return isWormholeError(error) && error.code === code;
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Convert any error to a WormholeError
 */
export function toWormholeError(error: unknown): WormholeError {
  if (isWormholeError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new WormholeError(error.message, WormholeErrorCode.UNKNOWN_ERROR, {
      originalError: error,
      stack: error.stack,
    });
  }

  return new WormholeError(
    getErrorMessage(error),
    WormholeErrorCode.UNKNOWN_ERROR,
    { originalError: error }
  );
}

/**
 * Wrap a promise to convert errors to WormholeError
 */
export async function wrapError<T>(
  promise: Promise<T>,
  errorFactory?: (error: unknown) => WormholeError
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (errorFactory) {
      throw errorFactory(error);
    }
    throw toWormholeError(error);
  }
}

/**
 * Check if error is user rejection (common pattern across wallets)
 */
export function isUserRejection(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('user canceled') ||
    message.includes('user disapproved') ||
    hasErrorCode(error, WormholeErrorCode.TX_REJECTED)
  );
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    hasErrorCode(error, WormholeErrorCode.TX_TIMEOUT)
  );
}

/**
 * Check if error is recoverable (can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (!isWormholeError(error)) {
    return isNetworkError(error);
  }

  const recoverableCodes = [
    WormholeErrorCode.TX_TIMEOUT,
    WormholeErrorCode.QUOTE_EXPIRED,
  ];

  return recoverableCodes.includes(error.code) || isNetworkError(error);
}

/**
 * Format error for display to user (removes technical details)
 */
export function formatErrorForUser(error: unknown): string {
  if (isUserRejection(error)) {
    return 'Transaction was cancelled';
  }

  if (isWormholeError(error)) {
    // Return user-friendly message without technical details
    return error.message;
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}
