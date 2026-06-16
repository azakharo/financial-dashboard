import type {PricePoint} from '@/shared/api';

export function selectPricePointsByTimeframe(
  points: PricePoint[] | undefined,
): PricePoint[] {
  if (!points) return [];
  return points;
}

export function selectLatestPrice(
  points: PricePoint[] | undefined,
): number | undefined {
  if (!points || points.length === 0) return undefined;
  return points[points.length - 1].price;
}

export function selectMinPrice(points: PricePoint[] | undefined): number {
  if (!points || points.length === 0) return 0;
  return Math.min(...points.map(p => p.price));
}

export function selectMaxPrice(points: PricePoint[] | undefined): number {
  if (!points || points.length === 0) return 0;
  return Math.max(...points.map(p => p.price));
}

export function selectPriceRange(
  points: PricePoint[] | undefined,
): [number, number] {
  const min = selectMinPrice(points);
  const max = selectMaxPrice(points);
  const padding = (max - min) * 0.1;
  return [Math.max(0, min - padding), max + padding];
}

export function selectChartData(
  points: PricePoint[] | undefined,
): Array<{timestamp: Date; price: number}> {
  if (!points) return [];
  return points.map(p => ({timestamp: p.timestamp, price: p.price}));
}
