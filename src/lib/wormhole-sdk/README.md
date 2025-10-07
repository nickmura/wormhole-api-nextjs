# Wormhole Bridge SDK

A modular, framework-agnostic TypeScript SDK for integrating Wormhole cross-chain bridge functionality into any application.

## 📁 Structure

```
wormhole-sdk/
├── core/                          # Framework-agnostic core (COMPLETE ✅)
│   ├── types.ts                   # TypeScript type definitions
│   ├── constants.ts               # Constants and configuration
│   ├── errors.ts                  # Custom error classes
│   └── index.ts                   # Public API exports
│
├── adapters/                      # Wallet/Signer adapters (TODO)
│   ├── signer-adapter.ts          # Abstract signer interface
│   ├── viem-adapter.ts            # Viem/Wagmi implementation
│   └── ethers-adapter.ts          # Direct ethers implementation
│
├── services/                      # Business logic services (TODO)
│   ├── bridge-service.ts          # Main bridge orchestration
│   ├── quote-service.ts           # Quote fetching & comparison
│   ├── transfer-service.ts        # Transfer execution
│   └── tracking-service.ts        # Transaction tracking
│
├── utils/                         # Utility functions (TODO)
│   ├── formatting.ts              # Amount/time formatting
│   ├── validation.ts              # Input validation
│   └── route-helpers.ts           # Route comparison/selection
│
└── index.ts                       # Main SDK entry point
```

---

## 🎯 Core Module (Complete)

The core module provides **framework-agnostic** types, constants, and utilities that can be used in any JavaScript/TypeScript project.

### Features

✅ **Comprehensive Type Definitions** - 60+ TypeScript interfaces and types
✅ **Route Metadata** - Detailed information about all route types
✅ **Error Handling** - Structured error classes with error codes
✅ **Constants** - Network configs, timing, fees, validation rules
✅ **Type Guards** - Runtime type checking utilities
✅ **Zero Dependencies** - Pure TypeScript, no external deps

### Usage

```typescript
import {
  type BridgeQuote,
  type TransferParams,
  RouteType,
  WormholeError,
  WORMHOLE_CONSTANTS,
} from './wormhole-sdk/core';

// Use types for type safety
const params: TransferParams = {
  sourceChain: 'Arbitrum',
  destChain: 'Optimism',
  token: { address: '0x...', symbol: 'USDC', decimals: 6, chainId: 42161 },
  amount: '100000000', // 100 USDC (6 decimals)
  senderAddress: '0x...',
  recipientAddress: '0x...',
};

// Use constants
const fastestRoute = WORMHOLE_CONSTANTS.FASTEST_ROUTE_PRIORITY[0];
console.log(fastestRoute); // RouteType.AUTOMATIC_CCTP

// Handle errors
try {
  // ... bridge operation
} catch (error) {
  if (error instanceof WormholeError) {
    console.error(`Error [${error.code}]:`, error.message);
  }
}
```

---

## 📋 Type Definitions

### Core Types

```typescript
// Chain configuration
interface Chain {
  id: number;
  name: string;
  nativeCurrency: string;
  wormholeChainId?: number;
}

// Token information
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

// Route information
interface Route {
  type: RouteType;
  name: string;
  description: string;
  estimatedTime: number;
  relayFee?: TokenAmount;
  isAutomatic: boolean;
  requiresManualClaim: boolean;
}

// Bridge quote
interface BridgeQuote {
  sourceToken: TokenAmount;
  destinationToken: TokenAmount;
  route: Route;
  relayFee?: TokenAmount;
  eta: number;
  success: boolean;
  error?: string;
}

// Transfer parameters
interface TransferParams {
  sourceChain: string;
  destChain: string;
  token: Token;
  amount: string;
  senderAddress: string;
  recipientAddress: string;
  route?: Route;
}

// Transfer receipt
interface TransferReceipt {
  txHash: string;
  originTxs: TransactionReference[];
  route: Route;
  wormholeScanUrl: string;
  status: TransferStatus;
}
```

### Enums

```typescript
enum RouteType {
  AUTOMATIC_CCTP = 'AutomaticCCTPRoute',
  CCTP_MANUAL = 'CCTPRoute',
  TOKEN_BRIDGE_AUTO = 'AutomaticTokenBridgeRoute',
  TOKEN_BRIDGE_MANUAL = 'TokenBridgeRoute',
}

enum TransferStatus {
  PENDING = 'pending',
  APPROVING = 'approving',
  TRANSFERRING = 'transferring',
  RELAYING = 'relaying',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

enum WormholeErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  CHAIN_NOT_FOUND = 'CHAIN_NOT_FOUND',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  QUOTE_FAILED = 'QUOTE_FAILED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  // ... and more
}
```

---

## 🛡️ Error Handling

Structured error classes with error codes for better error handling:

```typescript
import {
  WormholeError,
  QuoteFailedError,
  TransferFailedError,
  WalletNotConnectedError,
  isWormholeError,
  formatErrorForUser,
} from './wormhole-sdk/core';

try {
  // Bridge operation
} catch (error) {
  // Check if it's a Wormhole error
  if (isWormholeError(error)) {
    console.error(`Error [${error.code}]:`, error.message);
    console.error('Details:', error.details);

    // Format for user display
    const userMessage = formatErrorForUser(error);
    alert(userMessage);
  }

  // Handle specific error types
  if (error instanceof WalletNotConnectedError) {
    // Prompt wallet connection
  }

  if (error instanceof QuoteFailedError) {
    // Retry quote fetch
  }
}
```

---

## 📊 Constants

### Route Priority

```typescript
import { DEFAULT_ROUTE_PRIORITY, ROUTE_METADATA } from './wormhole-sdk/core';

// Default priority (balanced)
console.log(DEFAULT_ROUTE_PRIORITY);
// [AutomaticCCTPRoute, CCTPRoute, AutomaticTokenBridgeRoute, TokenBridgeRoute]

// Get route metadata
const metadata = ROUTE_METADATA[RouteType.AUTOMATIC_CCTP];
console.log(metadata);
// {
//   name: 'Fast CCTP (Automatic)',
//   description: 'Fastest delivery with automatic relayer - includes relay fee',
//   averageTime: 900000, // 15 minutes in ms
//   reliability: 'high',
//   requiresManualClaim: false,
//   isAutomatic: true,
//   supportedTokens: ['USDC'],
// }
```

### Timing & Fees

```typescript
import { TIMING, FEES } from './wormhole-sdk/core';

// Quote expiration
const quoteExpiresIn = TIMING.QUOTE_EXPIRATION_MS; // 60000 (1 minute)

// Default slippage
const slippage = FEES.DEFAULT_SLIPPAGE_BPS; // 100 (1%)
```

### URLs

```typescript
import { URLS } from './wormhole-sdk/core';

// Wormhole scan
const scanUrl = `${URLS.WORMHOLE_SCAN}/#/tx/${txHash}`;

// Block explorer
const explorerUrl = `${URLS.EXPLORERS.Arbitrum}/tx/${txHash}`;
```

---

## 🔧 Utility Functions

### Type Guards

```typescript
import { isNativeToken, isAutomaticRoute, hasRelayFee } from './wormhole-sdk/core';

// Check if token is native
if (isNativeToken(token)) {
  console.log('Native token (ETH, MATIC, BNB, etc.)');
}

// Check if route is automatic
if (isAutomaticRoute(route)) {
  console.log('Automatic route - no manual claim needed');
}

// Check if quote has relay fee
if (hasRelayFee(quote)) {
  console.log('Relay fee:', quote.relayFee);
}
```

### Error Utilities

```typescript
import {
  isUserRejection,
  isNetworkError,
  isRecoverableError,
} from './wormhole-sdk/core';

try {
  // ... operation
} catch (error) {
  if (isUserRejection(error)) {
    // User cancelled - don't show error
    return;
  }

  if (isRecoverableError(error)) {
    // Can retry
    await retry();
  }

  if (isNetworkError(error)) {
    // Network issue - check connection
    checkConnection();
  }
}
```

---

## 🚀 Next Modules

### Adapters (TODO)

Wallet/signer adapters for different libraries:

- **Viem Adapter** - For wagmi/viem users
- **Ethers Adapter** - For ethers.js users
- **Solana Adapter** - For Solana wallets

### Services (TODO)

Business logic services:

- **BridgeService** - Main orchestration
- **QuoteService** - Quote fetching and comparison
- **TransferService** - Transfer execution
- **TrackingService** - Transaction status tracking

### Utils (TODO)

Utility functions:

- **Formatting** - Amount/time formatting
- **Validation** - Input validation
- **Route Helpers** - Route comparison and selection

---

## 📦 Benefits of This Architecture

### ✅ **Framework Agnostic**

The core module has zero dependencies and can be used in:

- React / Next.js
- Vue / Nuxt
- Svelte / SvelteKit
- Vanilla JavaScript
- Node.js backend
- React Native

### ✅ **Type Safe**

Full TypeScript support with comprehensive type definitions:

- Autocomplete in your IDE
- Compile-time type checking
- Self-documenting code

### ✅ **Modular**

Use only what you need:

```typescript
// Import specific types
import { type BridgeQuote, RouteType } from './wormhole-sdk/core';

// Or import everything
import * as WormholeSDK from './wormhole-sdk/core';
```

### ✅ **Testable**

Clear separation of concerns makes testing easy:

- Mock interfaces
- Test utilities in isolation
- Integration tests without UI

### ✅ **Portable**

Easy to extract and publish:

1. Copy `wormhole-sdk/` folder
2. Update imports
3. Publish to NPM
4. Use in any project

---

## 📚 Example Integration

```typescript
import {
  type TransferParams,
  type BridgeQuote,
  RouteType,
  WormholeError,
  ROUTE_METADATA,
  formatErrorForUser,
} from './wormhole-sdk/core';

// Define transfer parameters
const params: TransferParams = {
  sourceChain: 'Arbitrum',
  destChain: 'Optimism',
  token: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    decimals: 6,
    chainId: 42161,
  },
  amount: '10000000', // 10 USDC
  senderAddress: '0x...',
  recipientAddress: '0x...',
};

// Get route information
const routeInfo = ROUTE_METADATA[RouteType.CCTP_MANUAL];
console.log(`${routeInfo.name}: ${routeInfo.description}`);
console.log(`Estimated time: ${routeInfo.averageTime / 60000} minutes`);
console.log(`Manual claim required: ${routeInfo.requiresManualClaim}`);

// Handle errors properly
try {
  // ... bridge operation
} catch (error) {
  const userMessage = formatErrorForUser(error);
  console.error(userMessage);

  if (error instanceof WormholeError) {
    // Log technical details for debugging
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
  }
}
```

---

## 🎯 Status

| Module | Status | Progress |
|--------|--------|----------|
| **Core** | ✅ Complete | 100% |
| Adapters | 📋 Planned | 0% |
| Services | 📋 Planned | 0% |
| Utils | 📋 Planned | 0% |
| Documentation | 🚧 In Progress | 60% |

---

## 🤝 Contributing

This SDK is designed to be modular and extensible. To add new features:

1. **Add types** to `core/types.ts`
2. **Add constants** to `core/constants.ts`
3. **Add error classes** to `core/errors.ts`
4. **Update exports** in `core/index.ts`
5. **Document** usage in this README

---

## 📄 License

MIT - See LICENSE file for details

---

## 🔗 Links

- [Wormhole Documentation](https://docs.wormhole.com)
- [Wormhole Scan](https://wormholescan.io)
- [Project Audit Report](../../AUDIT_REPORT.md)
- [Implementation Summary](../../IMPLEMENTATION_SUMMARY.md)
