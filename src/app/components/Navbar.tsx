'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-800 bg-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-indigo-400">Wormhole</div>
          <div className="text-sm text-gray-400">Bridge</div>
        </div>

        <ConnectButton />
      </div>
    </nav>
  );
}
