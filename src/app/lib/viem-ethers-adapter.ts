import type { WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';

/**
 * Converts a viem WalletClient to an ethers v6 compatible signer
 * This signer uses eth_sendTransaction instead of eth_signTransaction
 */
export function walletClientToEthersSigner(walletClient: WalletClient) {
  const { account, chain } = walletClient;

  if (!account || !chain) {
    throw new Error('Wallet not connected');
  }

  // Create a public client for reading blockchain data
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  // Create a custom ethers signer that delegates to viem
  return {
    provider: {
      getNetwork: async () => ({
        chainId: BigInt(chain.id),
        name: chain.name,
      }),

      // Add getFeeData method for gas estimation
      getFeeData: async () => {
        console.log('[ViemEthersAdapter] getFeeData called');

        // Get fee data from the chain
        const block = await publicClient.getBlock();
        const gasPrice = await publicClient.getGasPrice();

        // Calculate proper fee values
        const baseFee = block.baseFeePerGas || gasPrice;
        const maxPriorityFeePerGas = gasPrice / 10n; // 10% of gas price as priority fee
        const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

        console.log('[ViemEthersAdapter] Fee data:', {
          gasPrice: gasPrice.toString(),
          baseFee: baseFee.toString(),
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        });

        return {
          gasPrice: gasPrice,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
        };
      },

      // Add getBlock method
      getBlock: async () => {
        return await publicClient.getBlock();
      },

      // Add other provider methods that might be needed
      getBlockNumber: async () => {
        return await publicClient.getBlockNumber();
      },
    },

    getAddress: async () => account.address,

    // Add getNonce method
    getNonce: async () => {
      console.log('[ViemEthersAdapter] getNonce called');
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      });
      return nonce;
    },

    // This is the key method - use sendTransaction instead of signTransaction
    sendTransaction: async (transaction: any) => {
      console.log('[ViemEthersAdapter] sendTransaction called:', transaction);

      // Use viem's sendTransaction which uses eth_sendTransaction
      const hash = await walletClient.sendTransaction({
        to: transaction.to as `0x${string}`,
        data: transaction.data as `0x${string}`,
        value: transaction.value ? BigInt(transaction.value) : undefined,
        gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
        maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : undefined,
        nonce: transaction.nonce,
        account: account,
        chain: chain,
      });

      console.log('[ViemEthersAdapter] Transaction sent, hash:', hash);
      console.log('[ViemEthersAdapter] Waiting for transaction receipt...');

      // Wait for the transaction to be mined before returning
      // This is important - the SDK needs the receipt to be available
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('[ViemEthersAdapter] Transaction receipt received:', receipt);

      // Return an ethers-compatible transaction response
      return {
        hash,
        // Receipt is already available, so wait() can return it immediately
        wait: async () => {
          return {
            ...receipt,
            transactionHash: hash,
          };
        },
      };
    },

    // signTransaction should not be called - throw error to catch issues
    signTransaction: async (transaction: any) => {
      console.error('[ViemEthersAdapter] signTransaction called - this should not happen!', transaction);
      throw new Error('signTransaction not supported - the SDK should use sendTransaction instead');
    },
  };
}
