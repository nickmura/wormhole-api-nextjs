'use client';

import { useState } from 'react';
import { TOKENS } from '../lib/tokens';
import type { ChainId } from '../lib/chains';

interface TokenSelectorProps {
  chainId: ChainId;
  selectedToken: string;
  onTokenChange: (token: string) => void;
}

export default function TokenSelector({ chainId, selectedToken, onTokenChange }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tokens = TOKENS[chainId] || {};
  const tokenList = Object.keys(tokens);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#2a2a3e] hover:bg-[#333347] rounded-lg transition-colors border border-gray-700"
      >
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {selectedToken.slice(0, 1)}
        </div>
        <span className="text-white font-medium">{selectedToken}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          <div className="absolute top-full mt-2 w-full bg-[#2a2a3e] border border-gray-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {tokenList.map((token) => (
              <button
                key={token}
                onClick={() => {
                  onTokenChange(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#333347] transition-colors text-left border-b border-gray-700 last:border-b-0"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {token.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">{token}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {tokens[token as keyof typeof tokens]?.address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
