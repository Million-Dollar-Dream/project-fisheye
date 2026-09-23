"use client";

import Link from "next/link";
import { useState } from "react";
import type { MonthlyPoint } from "@/lib/chartData";
import { ChartIcon } from "../../ui";

type BarChartProps = {
  title: string;
  data: MonthlyPoint[];
  valueSuffix?: string;
  formatValue?: (value: number) => string;
};

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_LEFT = 44;
const PADDING_BOTTOM = 28;
const PADDING_TOP = 16;
const PADDING_RIGHT = 12;

export default function BarChart({
  title,
  data,
  formatValue = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
}: BarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="viz-root rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ChartIcon className="size-4 text-[var(--series-1)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <div className="flex min-h-44 flex-col items-center justify-center text-center">
          <p className="text-sm text-[var(--text-secondary)]">No data to chart yet.</p>
          <Link href="/log" className="mt-3 text-sm font-medium text-[var(--series-1)] hover:underline">
            Log the first entry
          </Link>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barSlot = plotWidth / data.length;
  const barWidth = Math.min(24, barSlot * 0.6);

  const yTicks = [0, 0.5, 1].map((fraction) => {
    const value = maxValue * fraction;
    const y = PADDING_TOP + plotHeight * (1 - fraction);
    return { value, y };
  });

  return (
    <div className="viz-root rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ChartIcon className="size-4 text-[var(--series-1)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title}: ${data.map((point) => `${point.label}, ${formatValue(point.value)}`).join("; ")}`}
        className="w-full"
      >
        {yTicks.map(({ value, y }) => (
          <g key={y}>
            <line
              x1={PADDING_LEFT}
              x2={WIDTH - PADDING_RIGHT}
              y1={y}
              y2={y}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text
              x={PADDING_LEFT - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--text-muted)] text-[10px]"
            >
              {formatValue(value)}
            </text>
          </g>
        ))}
        <line
          x1={PADDING_LEFT}
          x2={WIDTH - PADDING_RIGHT}
          y1={PADDING_TOP + plotHeight}
          y2={PADDING_TOP + plotHeight}
          stroke="var(--baseline)"
          strokeWidth={1}
        />

        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * plotHeight;
          const slotStart = PADDING_LEFT + index * barSlot;
          const x = slotStart + (barSlot - barWidth) / 2;
          const y = PADDING_TOP + plotHeight - barHeight;
          const isHovered = hoverIndex === index;

          return (
            <g
              key={point.label}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <rect
                x={slotStart}
                y={PADDING_TOP}
                width={barSlot}
                height={plotHeight}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill="var(--series-1)"
                opacity={isHovered ? 1 : 0.9}
              />
              <text
                x={slotStart + barSlot / 2}
                y={HEIGHT - PADDING_BOTTOM + 16}
                textAnchor="middle"
                className="fill-[var(--text-muted)] text-[10px]"
              >
                {point.label}
              </text>
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(
                      Math.max(x + barWidth / 2 - 34, PADDING_LEFT),
                      WIDTH - PADDING_RIGHT - 68,
                    )}
                    y={Math.max(y - 26, PADDING_TOP)}
                    width={68}
                    height={20}
                    rx={4}
                    fill="var(--text-primary)"
                  />
                  <text
                    x={Math.min(
                      Math.max(x + barWidth / 2, PADDING_LEFT + 34),
                      WIDTH - PADDING_RIGHT - 34,
                    )}
                    y={Math.max(y - 13, PADDING_TOP + 13)}
                    textAnchor="middle"
                    className="fill-[var(--surface-1)] text-[10px] font-medium"
                  >
                    {formatValue(point.value)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
.viz-root {
  color-scheme: light;
  --surface-1: #ffffff;
  --text-primary: #1c1917;
  --text-secondary: #78716c;
  --text-muted: #a8a29e;
  --gridline: #f1f0ed;
  --baseline: #d6d3d1;
  --border: #e7e5e4;
  --series-1: #047857;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) .viz-root {
    color-scheme: dark;
    --surface-1: rgba(255,255,255,0.05);
    --text-primary: #ffffff;
    --text-secondary: #a8a29e;
    --text-muted: #78716c;
    --gridline: rgba(255,255,255,0.07);
    --baseline: rgba(255,255,255,0.15);
    --border: rgba(255,255,255,0.10);
    --series-1: #34d399;
  }
}
:root[data-theme="dark"] .viz-root {
  color-scheme: dark;
  --surface-1: rgba(255,255,255,0.05);
  --text-primary: #ffffff;
  --text-secondary: #a8a29e;
  --text-muted: #78716c;
  --gridline: rgba(255,255,255,0.07);
  --baseline: rgba(255,255,255,0.15);
  --border: rgba(255,255,255,0.10);
  --series-1: #34d399;
}
`;
