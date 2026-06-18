import {Card, CardContent, CardHeader, CardTitle} from '@/shared/ui/card';
import {Badge} from '@/shared/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {format} from 'date-fns';

import {useStockHistory} from '@/entities/price-history';
import {useUIStore} from '@/shared/store';
import type {Timeframe, PricePoint} from '@/shared/api';
import {useMemo} from 'react';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '1Y'];

function formatXAxisTimestamp(ts: number, timeframe: Timeframe): string {
  const date = new Date(ts);
  switch (timeframe) {
    case '1D':
      return format(date, 'HH:mm');
    case '1W':
      return format(date, 'eeee');
    case '1M':
      return format(date, 'dd.MM');
    case '1Y':
      return format(date, 'LLL');
    default:
      return format(date, 'd MMM');
  }
}

function formatTooltipTimestamp(timestamp: Date): string {
  return format(timestamp, 'd MMM, HH:mm');
}

interface ChartDataPoint {
  ts: number;
  timestamp: Date;
  price: number;
}

function prepareChartData(points: PricePoint[]): ChartDataPoint[] {
  return points.map(p => {
    return {
      ts: p.timestamp.getTime(),
      timestamp: p.timestamp,
      price: p.price,
    };
  });
}

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

export function TimeframeSelector({value, onChange}: TimeframeSelectorProps) {
  return (
    <div className="flex gap-2">
      {TIMEFRAMES.map(tf => (
        <Badge
          key={tf}
          variant={value === tf ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onChange(tf)}
        >
          {tf}
        </Badge>
      ))}
    </div>
  );
}

interface StockChartHeaderProps {
  ticker: string | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  latestPrice: number | undefined;
  priceChange: number;
}

function StockChartHeader({
  ticker,
  timeframe,
  onTimeframeChange,
  latestPrice,
  priceChange,
}: StockChartHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <CardTitle>
        {ticker ? `${ticker}` : 'Выберите акцию'}
        {latestPrice !== undefined && (
          <span className="ml-4 text-lg font-normal text-muted-foreground">
            {latestPrice.toLocaleString('ru-RU', {
              style: 'currency',
              currency: 'USD',
            })}
            <span
              className={`
                ml-2
                ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}
              `}
            >
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)}%
            </span>
          </span>
        )}
      </CardTitle>
      {ticker && (
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
      )}
    </div>
  );
}

export function StockChart() {
  const selectedTicker = useUIStore(s => s.selectedTicker);
  const chartTimeframe = useUIStore(s => s.chartTimeframe);
  const setChartTimeframe = useUIStore(s => s.setChartTimeframe);

  const {data, isLoading} = useStockHistory(selectedTicker, chartTimeframe);

  const preparedData = useMemo(() => {
    return prepareChartData(data ?? []);
  }, [data]);

  const latestPrice = data?.[data.length - 1]?.price;
  const previousPrice = data?.[data.length - 2]?.price;
  const priceChange =
    latestPrice !== undefined && previousPrice !== undefined
      ? ((latestPrice - previousPrice) / previousPrice) * 100
      : 0;

  if (!selectedTicker) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>График акции</CardTitle>
        </CardHeader>
        <CardContent
          className="
            flex h-80 items-center justify-center text-muted-foreground
          "
        >
          Выберите акцию в таблице для отображения графика
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{selectedTicker}</CardTitle>
        </CardHeader>
        <CardContent
          className="
            flex h-80 items-center justify-center text-muted-foreground
          "
        >
          Загрузка данных...
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{selectedTicker}</CardTitle>
        </CardHeader>
        <CardContent
          className="
            flex h-80 items-center justify-center text-muted-foreground
          "
        >
          Нет данных для отображения
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <StockChartHeader
          ticker={selectedTicker}
          timeframe={chartTimeframe}
          onTimeframeChange={setChartTimeframe}
          latestPrice={latestPrice}
          priceChange={priceChange}
        />
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="stock-chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={preparedData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts: number) =>
                  formatXAxisTimestamp(ts, chartTimeframe)
                }
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({active, payload}) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="text-xs text-muted-foreground">
                        {formatTooltipTimestamp(point.timestamp)}
                      </div>
                      <div className="font-mono font-semibold">
                        {point.price.toLocaleString('ru-RU', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorPrice)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
