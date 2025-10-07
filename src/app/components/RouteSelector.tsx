'use client';

export interface RouteOption {
  type: string;
  name: string;
  description: string;
  fee: string;
  feeAmount: number;
  estimatedTime: string;
  isAutomatic: boolean;
}

interface RouteSelectorProps {
  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  onSelectRoute: (route: RouteOption) => void;
}

export default function RouteSelector({ routes, selectedRoute, onSelectRoute }: RouteSelectorProps) {
  if (routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Select Route</h4>

      <div className="space-y-2">
        {routes.map((route, index) => (
          <button
            key={index}
            onClick={() => onSelectRoute(route)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedRoute?.type === route.type
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 bg-[#1e1e2e] hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{route.name}</span>
                {route.isAutomatic && (
                  <span className="px-2 py-0.5 bg-green-600/20 border border-green-500/30 rounded text-xs text-green-300">
                    Auto
                  </span>
                )}
                {!route.isAutomatic && (
                  <span className="px-2 py-0.5 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
                    Manual
                  </span>
                )}
              </div>

              {route.feeAmount > 0 ? (
                <span className="text-sm font-medium text-orange-400">{route.fee}</span>
              ) : (
                <span className="text-sm font-medium text-green-400">Free</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-1">{route.description}</p>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Est. time: {route.estimatedTime}</span>
              {selectedRoute?.type === route.type && (
                <span className="text-indigo-400">✓ Selected</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedRoute && !selectedRoute.isAutomatic && (
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm">⚠️</span>
            <div className="text-xs text-yellow-200">
              <p className="font-medium mb-1">Manual Route Selected</p>
              <p className="text-yellow-300/80">
                You&apos;ll need to manually claim tokens on the destination chain after the transfer completes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
