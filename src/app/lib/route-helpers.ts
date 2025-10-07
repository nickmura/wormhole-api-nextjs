import type { RouteOption } from '../components/RouteSelector';

/**
 * Convert raw Wormhole routes to user-friendly route options
 */
export function formatRoutes(allRoutes: any[], quotes: any[]): RouteOption[] {
  return allRoutes.map((route, index) => {
    const routeType = route.constructor.name;
    const quote = quotes[index];

    // Extract fee information
    const relayFee = quote?.relayFee;
    const feeAmount = relayFee
      ? parseFloat(relayFee.amount.amount) / Math.pow(10, relayFee.amount.decimals)
      : 0;
    const feeDisplay = relayFee
      ? `${feeAmount.toFixed(6)} ${relayFee.token.symbol || 'tokens'}`
      : 'Free';

    // Calculate estimated time
    const eta = quote?.eta || 0;
    const estimatedTime = formatETA(eta);

    return {
      type: routeType,
      name: getRouteName(routeType),
      description: getRouteDescription(routeType),
      fee: feeDisplay,
      feeAmount,
      estimatedTime,
      isAutomatic: isAutomaticRoute(routeType),
    };
  });
}

/**
 * Get user-friendly route name
 */
function getRouteName(routeType: string): string {
  const names: Record<string, string> = {
    AutomaticCCTPRoute: 'Fast CCTP (Automatic)',
    CCTPRoute: 'Fast CCTP (Manual)',
    AutomaticTokenBridgeRoute: 'Token Bridge (Automatic)',
    TokenBridgeRoute: 'Token Bridge (Manual)',
  };

  return names[routeType] || routeType;
}

/**
 * Get route description
 */
function getRouteDescription(routeType: string): string {
  const descriptions: Record<string, string> = {
    AutomaticCCTPRoute: 'Fastest delivery with automatic relayer - includes relay fee',
    CCTPRoute: 'Fast delivery - requires manual claim on destination chain',
    AutomaticTokenBridgeRoute: 'Automatic delivery via Token Bridge - may take longer',
    TokenBridgeRoute: 'Cheapest option - requires manual claim and takes ~12+ days',
  };

  return descriptions[routeType] || 'Standard bridge route';
}

/**
 * Check if route is automatic (uses relayer)
 */
function isAutomaticRoute(routeType: string): boolean {
  return routeType.includes('Automatic');
}

/**
 * Format ETA from milliseconds to human-readable string
 */
function formatETA(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `~${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `~${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `~${minutes} min`;
  return `~${seconds} sec`;
}

/**
 * Sort routes by criteria
 */
export function sortRoutesByFee(routes: RouteOption[]): RouteOption[] {
  return [...routes].sort((a, b) => a.feeAmount - b.feeAmount);
}

export function sortRoutesBySpeed(routes: RouteOption[]): RouteOption[] {
  return [...routes].sort((a, b) => {
    // Parse time strings and compare
    const aTime = parseTimeString(a.estimatedTime);
    const bTime = parseTimeString(b.estimatedTime);
    return aTime - bTime;
  });
}

function parseTimeString(timeStr: string): number {
  const match = timeStr.match(/~(\d+)\s*(\w+)/);
  if (!match) return Infinity;

  const [, value, unit] = match;
  const num = parseInt(value);

  const multipliers: Record<string, number> = {
    sec: 1,
    min: 60,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
  };

  return num * (multipliers[unit] || 1);
}
