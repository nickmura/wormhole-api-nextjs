import { wormhole, routes, Wormhole } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import type { WalletClient } from 'viem';
import { walletClientToEthersSigner } from './viem-ethers-adapter';

/**
 * Custom signer that uses sendTransaction directly instead of sign+broadcast
 * This avoids the eth_signTransaction method which wallets don't support
 */
class ViemWormholeSigner {
  constructor(
    private chainName: string,
    private walletAddress: string,
    private ethersSigner: any
  ) {}

  chain() {
    return this.chainName;
  }

  address() {
    return this.walletAddress;
  }

  // Implement signAndSend instead of sign - this is the key!
  async signAndSend(txns: any[]) {
    console.log('[ViemWormholeSigner] signAndSend called with', txns.length, 'transactions');

    const txids = [];
    for (const txn of txns) {
      const { transaction, description } = txn;
      console.log(`[ViemWormholeSigner] Sending: ${description}`);

      const response = await this.ethersSigner.sendTransaction(transaction);
      txids.push(response.hash);
    }

    return txids;
  }
}

/**
 * Create a Wormhole-compatible signer from a viem WalletClient
 */
export async function createWormholeSigner(walletClient: WalletClient, wh: any, chainName: string) {
  const { account, chain } = walletClient;

  if (!account || !chain) {
    throw new Error('Wallet not connected');
  }

  console.log('[Wormhole] Creating custom ethers signer from viem wallet');

  // Convert viem WalletClient to an ethers-compatible signer that uses sendTransaction
  const ethersSigner = walletClientToEthersSigner(walletClient);

  console.log('[Wormhole] Creating ViemWormholeSigner (SignAndSendSigner)');

  // Create our custom SignAndSendSigner
  const signer = new ViemWormholeSigner(
    chainName,
    account.address,
    ethersSigner
  );

  console.log('[Wormhole] Custom signer created:', signer);

  return signer;
}

/**
 * Initialize Wormhole SDK
 */
async function initWormhole() {
  return await wormhole('Mainnet', [evm]);
}

/**
 * Get a route quote for a cross-chain transfer
 */
export async function getTransferQuote(params: {
  sourceChain: string;
  destChain: string;
  tokenAddress: string;
  amount: string;
  sourceAddress: string;
  destAddress: string;
}) {
  try {
    console.log('[Wormhole] getTransferQuote called with params:', params);
    const { sourceChain, destChain, tokenAddress } = params;

    console.log('[Wormhole] Initializing SDK...');
    // Initialize wormhole
    const wh = await initWormhole();
    console.log('[Wormhole] SDK initialized successfully');

  console.log('[Wormhole] Creating resolver...');
  // Create resolver with supported routes - order matters, prioritize faster routes
  const resolver = wh.resolver([
    routes.AutomaticCCTPRoute,    // Fastest for USDC - ~15 min with relayer
    routes.CCTPRoute,              // Fast for USDC - ~15 min manual
    routes.AutomaticTokenBridgeRoute, // Automatic with relayer
    routes.TokenBridgeRoute,       // Slowest - manual, no fees but takes days
  ]);

  console.log('[Wormhole] Getting chain contexts for:', { sourceChain, destChain });
  // Get chain contexts
  let srcChain, dstChain;
  try {
    srcChain = wh.getChain(sourceChain as any);
    console.log('[Wormhole] srcChain retrieved:', srcChain);
  } catch (e) {
    console.error('[Wormhole] Error getting srcChain:', e);
    throw e;
  }

  try {
    dstChain = wh.getChain(destChain as any);
    console.log('[Wormhole] dstChain retrieved:', dstChain);
  } catch (e) {
    console.error('[Wormhole] Error getting dstChain:', e);
    throw e;
  }

  console.log('[Wormhole] Chain contexts:', {
    srcChain: srcChain?.chain,
    dstChain: dstChain?.chain,
    srcChainType: typeof srcChain,
    dstChainType: typeof dstChain
  });

  // Create token ID
  // Native tokens use the special address 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const isNative = tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  console.log('[Wormhole] Creating token ID:', { tokenAddress, isNative });
  console.log('[Wormhole] srcChain.chain value:', srcChain?.chain, typeof srcChain?.chain);

  let tokenId;
  try {
    tokenId = Wormhole.tokenId(srcChain.chain, isNative ? 'native' : tokenAddress);
    console.log('[Wormhole] Token ID created successfully:', tokenId);
  } catch (e) {
    console.error('[Wormhole] Error creating tokenId:', e);
    console.error('[Wormhole] tokenId params were:', { chain: srcChain.chain, token: isNative ? 'native' : tokenAddress });
    throw e;
  }

  console.log('[Wormhole] Finding supported destination tokens...');
  // Find supported destination tokens
  let destTokens;
  try {
    console.log('[Wormhole] Calling supportedDestinationTokens with:', { tokenId, srcChain, dstChain });
    destTokens = await resolver.supportedDestinationTokens(tokenId, srcChain, dstChain);
    console.log('[Wormhole] Destination tokens found:', destTokens);
  } catch (e) {
    console.error('[Wormhole] Error getting destination tokens:', e);
    throw e;
  }

  if (!destTokens || destTokens.length === 0) {
    throw new Error('No supported destination tokens found');
  }

  console.log('[Wormhole] Creating transfer request...');
  // Create transfer request
  let transferRequest;
  try {
    // Parse sender and receiver addresses
    const senderAddr = Wormhole.parseAddress(srcChain.chain, params.sourceAddress);
    const receiverAddr = Wormhole.parseAddress(dstChain.chain, params.destAddress);

    console.log('[Wormhole] Parsed addresses:', { senderAddr, receiverAddr });

    console.log('[Wormhole] RouteTransferRequest.create params:', {
      source: tokenId,
      destination: destTokens[0],
    });

    transferRequest = await routes.RouteTransferRequest.create(wh, {
      source: tokenId,
      destination: destTokens[0],
    });

    // Set sender and receiver on the transfer request
    transferRequest.sender = senderAddr;
    transferRequest.receiver = receiverAddr;

    console.log('[Wormhole] Transfer request created with sender/receiver:', transferRequest);
  } catch (e) {
    console.error('[Wormhole] Error creating transfer request:', e);
    throw e;
  }

  console.log('[Wormhole] Finding routes...');
  // Find available routes
  let foundRoutes;
  try {
    console.log('[Wormhole] Calling findRoutes with transferRequest:', transferRequest);
    foundRoutes = await resolver.findRoutes(transferRequest);
    console.log('[Wormhole] Routes found:', foundRoutes?.length || 0);

    // Log all available routes
    if (foundRoutes && foundRoutes.length > 0) {
      foundRoutes.forEach((route: any, index: number) => {
        console.log(`[Wormhole] Route ${index + 1}:`, {
          type: route.constructor.name,
          route: route
        });
      });
    }
  } catch (e) {
    console.error('[Wormhole] Error finding routes:', e);
    throw e;
  }

  if (!foundRoutes || foundRoutes.length === 0) {
    throw new Error('No routes found for this transfer');
  }

  // Return best route (first one due to prioritization order)
  console.log('[Wormhole] Returning best route:', foundRoutes[0].constructor.name);
  return { route: foundRoutes[0], transferRequest, wh, allRoutes: foundRoutes };
  } catch (error: any) {
    console.error('[Wormhole] CAUGHT ERROR in getTransferQuote:', error);
    console.error('[Wormhole] Error message:', error?.message);
    console.error('[Wormhole] Error stack:', error?.stack);
    throw error;
  }
}

/**
 * Initiate a cross-chain transfer
 */
export async function initiateTransfer(params: {
  route: any;
  transferRequest: any;
  signer: any;
  wh: any;
  destAddress: string;
  amount: string;
}) {
  try {
    const { route, transferRequest, signer, wh, destAddress, amount: amt } = params;

    console.log('[Wormhole] Preparing transfer parameters:', { amount: amt, destAddress, amtType: typeof amt });
    // Prepare transfer parameters
    const transferParams = {
      amount: amt,
      options: { nativeGas: 0 }
    };

    console.log('[Wormhole] Validating transfer...');
    // Validate parameters
    let validated;
    try {
      console.log('[Wormhole] Calling route.validate with:', { transferRequest, transferParams });
      validated = await route.validate(transferRequest, transferParams);
      console.log('[Wormhole] Validation result:', validated);
    } catch (e) {
      console.error('[Wormhole] Error in route.validate:', e);
      throw e;
    }

    if (!validated.valid) {
      throw new Error(validated.error || 'Transfer validation failed');
    }

    console.log('[Wormhole] Getting quote...');
    // Get quote
    let quote;
    try {
      console.log('[Wormhole] Calling route.quote with:', { transferRequest, params: validated.params });
      quote = await route.quote(transferRequest, validated.params);
      console.log('[Wormhole] Quote result:', quote);
    } catch (e) {
      console.error('[Wormhole] Error in route.quote:', e);
      throw e;
    }

    if (!quote.success) {
      throw new Error(quote.error || 'Failed to get quote');
    }

    console.log('[Wormhole] Quote object keys:', Object.keys(quote));
    console.log('[Wormhole] TransferRequest details:', {
      hasSender: !!transferRequest.sender,
      hasReceiver: !!transferRequest.receiver,
      sender: transferRequest.sender,
      receiver: transferRequest.receiver,
    });

    console.log('[Wormhole] Initiating transfer with route...');
    // Initiate the transfer
    let receipt;
    try {
      // Create a ChainAddress with the chain NAME (string), not the chain context object
      const receiverChainAddress = {
        chain: quote.destinationToken.token.chain, // Use the chain name string
        address: transferRequest.receiver
      };

      console.log('[Wormhole] Calling route.initiate with 4 params');
      console.log('[Wormhole] Receiver ChainAddress:', receiverChainAddress);

      // route.initiate(request, signer, quote, receiverChainAddress)
      receipt = await route.initiate(transferRequest, signer, quote, receiverChainAddress);
      console.log('[Wormhole] Transfer receipt:', receipt);
      console.log('[Wormhole] Receipt type:', typeof receipt);
      console.log('[Wormhole] Receipt keys:', receipt ? Object.keys(receipt) : 'null');

      // Extract transaction hash from receipt
      // The receipt structure varies by route, but typically contains originTxs array
      const txHash = receipt?.originTxs?.[0]?.txid || receipt?.txid || receipt?.hash;
      console.log('[Wormhole] Extracted tx hash:', txHash);

    } catch (e) {
      console.error('[Wormhole] Error in route.initiate:', e);
      throw e;
    }

    return receipt;
  } catch (error: any) {
    console.error('[Wormhole] CAUGHT ERROR in initiateTransfer:', error);
    console.error('[Wormhole] Error message:', error?.message);
    console.error('[Wormhole] Error stack:', error?.stack);
    throw error;
  }
}
