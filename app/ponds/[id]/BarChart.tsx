"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/chartData";

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
      <div className="viz-root rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">No data yet.</p>
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
    <div className="viz-root rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">
        {title}
      </h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={title}
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
  --surface-1: #fcfcfb;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #898781;
  --gridline: #e1e0d9;
  --baseline: #c3c2b7;
  --border: rgba(11,11,11,0.10);
  --series-1: #2a78d6;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) .viz-root {
    color-scheme: dark;
    --surface-1: #1a1a19;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --gridline: #2c2c2a;
    --baseline: #383835;
    --border: rgba(255,255,255,0.10);
    --series-1: #3987e5;
  }
}
:root[data-theme="dark"] .viz-root {
  color-scheme: dark;
  --surface-1: #1a1a19;
  --text-primary: #ffffff;
  --text-secondary: #c3c2b7;
  --text-muted: #898781;
  --gridline: #2c2c2a;
  --baseline: #383835;
  --border: rgba(255,255,255,0.10);
  --series-1: #3987e5;
}
`;
