import React, { useState } from 'react';
import { HistoricalCandle } from '../types';

interface SparklineProps {
  candles: HistoricalCandle[];
  checkpointTime?: number;
  checkpointPrice?: number;
  width?: number;
  height?: number;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  candles,
  checkpointTime,
  checkpointPrice,
  width = 180,
  height = 54,
  isPositive = true
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!candles || candles.length < 2) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center text-xs text-slate-500 bg-slate-900/40 rounded border border-slate-800/60"
      >
        <span>No chart data</span>
      </div>
    );
  }

  const padding = 6;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const closes = candles.map(c => c.close);
  const minPrice = Math.min(...closes) * 0.998;
  const maxPrice = Math.max(...closes) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const getX = (index: number) => padding + (index / (candles.length - 1)) * usableWidth;
  const getY = (price: number) => height - padding - ((price - minPrice) / priceRange) * usableHeight;

  // Build SVG path
  const points = candles.map((c, i) => `${getX(i).toFixed(1)},${getY(c.close).toFixed(1)}`);
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${getX(candles.length - 1)},${height} L ${getX(0)},${height} Z`;

  // Find checkpoint marker X position
  let checkpointX: number | null = null;
  if (checkpointTime) {
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < candles.length; i++) {
      const diff = Math.abs(candles[i].timestamp - checkpointTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    checkpointX = getX(closestIndex);
  }

  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  const hoveredCandle = hoverIndex !== null ? candles[hoverIndex] : null;

  return (
    <div className="relative inline-block" onMouseLeave={() => setHoverIndex(null)}>
      <svg
        width={width}
        height={height}
        className="overflow-visible cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = e.clientX - rect.left - padding;
          const ratio = Math.max(0, Math.min(1, relativeX / usableWidth));
          const index = Math.round(ratio * (candles.length - 1));
          setHoverIndex(index);
        }}
      >
        <defs>
          <linearGradient id={`grad-${isPositive ? 'up' : 'down'}-${width}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.35" />
            <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <path d={areaPath} fill={`url(#grad-${isPositive ? 'up' : 'down'}-${width})`} />

        {/* Price Line */}
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* "You Were Here" Checkpoint Reference Marker */}
        {checkpointX !== null && (
          <g>
            <line
              x1={checkpointX}
              y1={2}
              x2={checkpointX}
              y2={height}
              stroke="#38bdf8"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <circle cx={checkpointX} cy={getY(checkpointPrice || closes[0])} r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
          </g>
        )}

        {/* Hover tracker */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={0}
              x2={getX(hoverIndex)}
              y2={height}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(candles[hoverIndex].close)}
              r="3.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredCandle && (
        <div 
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 rounded px-2 py-1 text-[11px] shadow-xl text-slate-200 whitespace-nowrap"
          style={{
            bottom: `${height + 4}px`,
            left: `${Math.min(width - 70, Math.max(0, getX(hoverIndex!) - 35))}px`
          }}
        >
          <div className="font-semibold text-white">${hoveredCandle.close.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(hoveredCandle.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
};
