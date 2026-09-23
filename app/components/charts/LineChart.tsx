"use client";

import { useState } from "react";
import { ChartTooltip, formatTick, niceScale, useChartWidth, type TooltipContent } from "./useChartWidth";

export type LinePoint = {
  key: string;
  label: string;
  value: number;
  tooltip: TooltipContent;
};

const PAD = { top: 24, right: 16, bottom: 26, left: 44 };

export default function LineChart({
  points,
  height = 240,
  ariaLabel,
  unit,
  color = "var(--series-1)",
}: {
  points: LinePoint[];
  height?: number;
  ariaLabel: string;
  unit?: string;
  color?: string;
}) {
  const { ref, width } = useChartWidth();
  const [active, setActive] = useState<number | null>(null);

  const { max, ticks } = niceScale(Math.max(...points.map((point) => point.value), 0));
  const plotWidth = width - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index: number) => PAD.left + (points.length > 1 ? index * step : plotWidth / 2);
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight;
  const labelEvery = Math.max(1, Math.ceil(44 / Math.max(step, 1)));

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
  const area = points.length
    ? `${line} L${x(points.length - 1)},${PAD.top + plotHeight} L${x(0)},${PAD.top + plotHeight} Z`
    : "";
  const gradientId = `area-${ariaLabel.replace(/\W+/g, "-")}`;

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-ink-3 text-[10.5px] tabular-nums"
            >
              {formatTick(tick)}
            </text>
          </g>
        ))}
        {unit && (
          <text x={4} y={10} textAnchor="start" className="fill-ink-3 text-[10.5px] font-medium">
            {unit}
          </text>
        )}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={PAD.top + plotHeight}
          y2={PAD.top + plotHeight}
          stroke="var(--axis)"
        />
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={PAD.top}
            y2={PAD.top + plotHeight}
            stroke="var(--line-strong)"
            strokeDasharray="3 3"
          />
        )}
        {points.map((point, index) => (
          <g key={point.key}>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={active === index ? 5 : 3.25}
              fill="var(--surface)"
              stroke={color}
              strokeWidth={2}
            />
            {index % labelEvery === 0 && (
              <text x={x(index)} y={height - 8} textAnchor="middle" className="fill-ink-3 text-[10.5px]">
                {point.label}
              </text>
            )}
            <rect
              x={x(index) - Math.max(step, 24) / 2}
              y={PAD.top}
              width={Math.max(step, 24)}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setActive(index)}
              onPointerDown={() => setActive(index)}
            />
          </g>
        ))}
      </svg>
      {active !== null && points[active] && (
        <ChartTooltip content={points[active].tooltip} x={x(active)} containerWidth={width} />
      )}
    </div>
  );
}
