// Chain configurations for Wormhole-supported networks
export const CHAINS = {
  1: {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: 'ETH',
  },
  137: {
    id: 137,
    name: 'Polygon',
    nativeCurrency: 'MATIC',
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    nativeCurrency: 'ETH',
  },
  10: {
    id: 10,
    name: 'Optimism',
    nativeCurrency: 'ETH',
  },
  8453: {
    id: 8453,
    name: 'Base',
    nativeCurrency: 'ETH',
  },
  56: {
    id: 56,
    name: 'BSC',
    nativeCurrency: 'BNB',
  },
  43114: {
    id: 43114,
    name: 'Avalanche',
    nativeCurrency: 'AVAX',
  },
} as const;

export type ChainId = keyof typeof CHAINS;
