'use client';

import { useState } from 'react';
import { useAccount, useBalance, useReadContract, useWalletClient } from 'wagmi';
import { formatUnits } from 'viem';
import ChainSelector from './ChainSelector';
import TokenSelector from './TokenSelector';
import { TOKENS } from '../lib/tokens';
import { CHAINS, type ChainId } from '../lib/chains';
import { createWormholeSigner, getTransferQuote, initiateTransfer } from '../lib/wormhole';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

export default function Bridge() {
  const [sourceChain, setSourceChain] = useState<ChainId>(8453); // Base
  const [destChain, setDestChain] = useState<ChainId>(1); // Ethereum
  const [sourceToken, setSourceToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null); // Store route, transferRequest, wh

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const sourceTokens = TOKENS[sourceChain] || {};
  const selectedTokenInfo = sourceTokens[sourceToken as keyof typeof sourceTokens];

  // Check if it's a native token (using the special address)
  const isNativeToken = selectedTokenInfo?.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

  // Get native token balance
  const { data: nativeBalance } = useBalance({
    address,
    chainId: sourceChain,
    query: {
      enabled: isConnected && isNativeToken,
    },
  });

  // Get ERC20 token balance
  const { data: erc20Balance } = useReadContract({
    address: selectedTokenInfo?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: sourceChain,
    query: {
      enabled: isConnected && !isNativeToken && !!address && !!selectedTokenInfo,
    },
  });

  // Calculate the actual balance
  const balance = isNativeToken
    ? nativeBalance
      ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
      : 0
    : erc20Balance && selectedTokenInfo
    ? parseFloat(formatUnits(erc20Balance as bigint, selectedTokenInfo.decimals))
    : 0;

  console.log('[Bridge] Balance calculation:', {
    isNativeToken,
    nativeBalance,
    erc20Balance,
    selectedTokenInfo,
    balance,
    balanceType: typeof balance,
  });

  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(destChain);
    setDestChain(temp);
  };

  const handleSetMax = () => {
    console.log('[Bridge] handleSetMax called, balance:', balance, typeof balance);
    const safeBalance = balance ?? 0;
    console.log('[Bridge] safeBalance:', safeBalance);
    setAmount(safeBalance.toString());
  };

  const handlePreviewTransaction = async () => {
    if (!isConnected || !address || !walletClient || !amount) {
      setTransferStatus('Please connect wallet and enter amount');
      return;
    }

    try {
      setIsTransferring(true);
      setTransferStatus('Getting route quote...');

      // Get chain names for Wormhole SDK (map chain IDs to names)
      const sourceChainName = CHAINS[sourceChain].name;
      const destChainName = CHAINS[destChain].name;

      console.log('[Bridge] Starting transfer:', {
        sourceChainName,
        destChainName,
        sourceToken,
        amount,
        amountType: typeof amount,
        address,
      });

      // Get token address from selected token
      const tokenAddress = selectedTokenInfo?.address;
      if (!tokenAddress) {
        setTransferStatus('Invalid token selected');
        return;
      }

      console.log('[Bridge] Token address:', tokenAddress);

      // Get transfer quote
      console.log('[Bridge] Calling getTransferQuote with amount:', amount, typeof amount);
      const { route, transferRequest, wh } = await getTransferQuote({
        sourceChain: sourceChainName,
        destChain: destChainName,
        tokenAddress: tokenAddress,
        amount: amount,
        sourceAddress: address,
        destAddress: address, // Using same address for destination
      });

      console.log('[Bridge] Quote received, route:', route);
      setTransferStatus('Quote received...');

      // Store quote for preview
      setQuote(null); // Clear previous quote first

      // Get quote details
      console.log('[Bridge] Getting detailed quote...');
      setTransferStatus('Getting quote...');

      const transferParams = { amount, options: { nativeGas: 0 } };
      const validated = await route.validate(transferRequest, transferParams);

      if (!validated.valid) {
        setTransferStatus(`Validation failed: ${validated.error}`);
        return;
      }

      const quoteResult = await route.quote(transferRequest, validated.params);

      if (!quoteResult.success) {
        setTransferStatus(`Quote failed: ${quoteResult.error}`);
        return;
      }

      console.log('[Bridge] Full quote object:', quoteResult);
      console.log('[Bridge] Quote ETA:', quoteResult.eta, 'milliseconds =', Math.floor(quoteResult.eta / 1000), 'seconds =', Math.floor(quoteResult.eta / 60000), 'minutes');
      console.log('[Bridge] Route type:', route.constructor.name);

      // Store quote and show preview with route info
      setQuote({
        ...quoteResult,
        routeType: route.constructor.name,
      });
      setShowPreview(true);
      setTransferStatus('Review the transaction details below');
      setIsTransferring(false);

      // TODO: Add transfer tracking and completion
      // This would involve monitoring the attestation and completing on dest chain

    } catch (error: any) {
      console.error('[Bridge] Transfer error:', error);
      console.error('[Bridge] Error stack:', error.stack);
      setTransferStatus(`Error: ${error.message || 'Transfer failed'}`);
      setIsTransferring(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!isConnected || !address || !walletClient || !quote) {
      return;
    }

    try {
      setIsTransferring(true);
      // Keep preview visible during transfer
      setTransferStatus('Preparing transaction...');

      // Get the route and transfer request again
      const sourceChainName = CHAINS[sourceChain].name;
      const destChainName = CHAINS[destChain].name;
      const tokenAddress = selectedTokenInfo?.address;

      if (!tokenAddress) {
        setTransferStatus('Invalid token selected');
        return;
      }

      const { route, transferRequest, wh } = await getTransferQuote({
        sourceChain: sourceChainName,
        destChain: destChainName,
        tokenAddress: tokenAddress,
        amount: amount,
        sourceAddress: address,
        destAddress: address,
      });

      // Create signer
      setTransferStatus('Waiting for wallet approval...');
      const signer = await createWormholeSigner(walletClient, wh, sourceChainName);

      // Initiate the transfer
      setTransferStatus('Step 1/2: Approving token...');
      const receipt = await initiateTransfer({
        route,
        transferRequest,
        signer,
        wh,
        destAddress: address,
        amount: amount,
      });

      console.log('[Bridge] Transfer initiated:', receipt);

      // Extract transaction hash from receipt - try multiple possible locations
      const txHash = receipt?.originTxs?.[0]?.txid || receipt?.txid || receipt?.hash || 'unknown';
      console.log('[Bridge] Extracted tx hash:', txHash);

      // Build Wormhole scanner URL
      const wormholeUrl = `https://wormholescan.io/#/tx/${txHash}?network=Mainnet`;

      setTransferStatus(
        <span>
          Transfer initiated! 🎉<br/>
          <a href={wormholeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
            View on Wormhole Scanner →
          </a>
        </span>
      );
      setQuote(null);

    } catch (error: any) {
      console.error('[Bridge] Transfer error:', error);
      setTransferStatus(`Error: ${error.message || 'Transfer failed'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-[#1e1e2e] rounded-2xl border border-gray-700 p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          TOKEN BRIDGE
        </h1>

        {/* Source Chain Section */}
        <div className="mb-4">
          <ChainSelector
            selectedChain={sourceChain}
            onChainChange={(chainId) => {
              setSourceChain(chainId);
              // Reset token to first available on new chain
              const newTokens = TOKENS[chainId] || {};
              const firstToken = Object.keys(newTokens)[0];
              if (firstToken) setSourceToken(firstToken);
            }}
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={handleSwapChains}
            className="p-3 bg-[#2a2a3e] hover:bg-[#333347] rounded-full border border-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Destination Chain Section */}
        <div className="mb-6">
          <ChainSelector
            selectedChain={destChain}
            onChainChange={setDestChain}
          />
        </div>

        {/* Token and Amount Section */}
        <div className="bg-[#2a2a3e] rounded-lg p-4 mb-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Token</span>
            <span className="text-gray-400 text-sm">Balance: {balance.toFixed(5)}</span>
          </div>

          <div className="mb-4">
            <TokenSelector
              chainId={sourceChain}
              selectedToken={sourceToken}
              onTokenChange={setSourceToken}
            />
          </div>

          <div className="bg-[#1e1e2e] rounded-lg p-4 border border-gray-700">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-white text-2xl font-medium outline-none"
              placeholder="0.0"
            />
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={handleSetMax}
              className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
              disabled={!isConnected || balance === 0}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Preview Transaction Button */}
        {!showPreview && (
          <button
            onClick={handlePreviewTransaction}
            disabled={!isConnected || !amount || isTransferring}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransferring ? 'GETTING QUOTE...' : 'PREVIEW TRANSACTION'}
          </button>
        )}

        {/* Quote Preview */}
        {showPreview && quote && (
          <div className="space-y-4">
            <div className="bg-[#2a2a3e] border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction Preview</h3>

              {/* Route Type Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300">
                  {quote.routeType === 'AutomaticCCTPRoute' && '⚡ Fast CCTP Route (Automatic)'}
                  {quote.routeType === 'CCTPRoute' && '⚡ Fast CCTP Route (Manual)'}
                  {quote.routeType === 'AutomaticTokenBridgeRoute' && 'Token Bridge (Automatic)'}
                  {quote.routeType === 'TokenBridgeRoute' && 'Token Bridge (Manual)'}
                  {!quote.routeType && 'Standard Route'}
                </span>
              </div>

              {/* Amount Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You send:</span>
                  <span className="text-white font-medium">
                    {(parseFloat(quote.sourceToken.amount.amount) / Math.pow(10, quote.sourceToken.amount.decimals)).toFixed(6)} {sourceToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-white font-medium">
                    {(parseFloat(quote.destinationToken.amount.amount) / Math.pow(10, quote.destinationToken.amount.decimals)).toFixed(6)} {sourceToken}
                  </span>
                </div>
                {quote.relayFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Relay fee:</span>
                    <span className="text-orange-400 font-medium">
                      {(parseFloat(quote.relayFee.amount.amount) / Math.pow(10, quote.relayFee.amount.decimals)).toFixed(6)} {sourceToken}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated time:</span>
                  <span className="text-white font-medium">
                    {(() => {
                      // ETA is in milliseconds, not seconds!
                      const seconds = Math.floor(quote.eta / 1000);
                      const minutes = Math.floor(seconds / 60);
                      const hours = Math.floor(minutes / 60);
                      const days = Math.floor(hours / 24);

                      if (days > 0) return `~${days} day${days > 1 ? 's' : ''}`;
                      if (hours > 0) return `~${hours} hour${hours > 1 ? 's' : ''}`;
                      if (minutes > 0) return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
                      return `~${seconds} second${seconds > 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Route Details */}
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Transaction Steps:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span className="text-gray-300">
                      Approve {sourceToken} spending on {CHAINS[sourceChain].name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span className="text-gray-300">
                      Lock {amount} {sourceToken} in Token Bridge on {CHAINS[sourceChain].name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span className="text-gray-300">
                      Wormhole relays tokens to {CHAINS[destChain].name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmTransfer}
              disabled={isTransferring}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransferring ? 'CONFIRMING TRANSFER...' : 'CONFIRM TRANSFER'}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setShowPreview(false);
                setQuote(null);
                setTransferStatus('');
              }}
              disabled={isTransferring}
              className="w-full py-2 bg-[#2a2a3e] hover:bg-[#333347] text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Transfer Status */}
        {transferStatus && (
          <div className="mt-4 p-3 bg-[#2a2a3e] border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">{transferStatus}</p>
          </div>
        )}

        {/* Developer Info */}
        <div className="mt-6 p-4 bg-[#2a2a3e] rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">
            Are you a developer looking to automate this interaction?
          </p>
          <a
            href="https://docs.wormhole.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            Docs
          </a>
        </div>

        {/* Powered By */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <span>Powered by</span>
          <span className="font-semibold text-gray-400">Wormhole</span>
        </div>
      </div>
    </div>
  );
}
