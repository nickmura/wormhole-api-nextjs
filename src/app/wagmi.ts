import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Wormhole Bridge',
  projectId: 'YOUR_PROJECT_ID', // Get your projectId at https://cloud.walletconnect.com
  chains: [
    mainnet,
    polygon,
    arbitrum,
    optimism,
    base,
    bsc,
    avalanche,
  ],
  ssr: true,
});
