'use client';

import { useState } from 'react';
import { CHAINS, type ChainId } from '../lib/chains';

interface ChainSelectorProps {
  selectedChain: ChainId;
  onChainChange: (chainId: ChainId) => void;
}

export default function ChainSelector({ selectedChain, onChainChange }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chainList = Object.values(CHAINS);
  const currentChain = CHAINS[selectedChain];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-[#2a2a3e] hover:bg-[#333347] rounded-lg transition-colors border border-gray-700 min-w-[180px]"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          {currentChain.name.slice(0, 1)}
        </div>
        <span className="text-white font-medium">{currentChain.name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full bg-[#2a2a3e] border border-gray-700 rounded-lg shadow-xl z-20">
            {chainList.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  onChainChange(chain.id as ChainId);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#333347] transition-colors text-left border-b border-gray-700 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {chain.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-white font-medium">{chain.name}</div>
                  <div className="text-xs text-gray-400">{chain.nativeCurrency}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
