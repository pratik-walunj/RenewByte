"use client";

import { useId, useState } from "react";
import { CHART_ACCENT, CHART_AXIS, CHART_GRID, formatTick, formatValue, niceScale, type ValueFormat } from "./scale";
import { useElementWidth } from "./use-width";

export type ColumnDatum = { key: string; label: string; fullLabel: string; value: number };

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 52 };

/** Single-series column chart (one accent hue, hairline grid) with hover/keyboard tooltip and an sr-only table. */
export function ColumnChart({
  data,
  format,
  label,
  summary,
}: {
  data: ColumnDatum[];
  format: ValueFormat;
  /** What the chart plots, e.g. "Revenue per day". */
  label: string;
  /** Plain-language takeaway for screen readers (and shown under the chart). */
  summary: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const summaryId = useId();

  const plotW = Math.max(40, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const { max, ticks } = niceScale(Math.max(0, ...data.map((d) => d.value)));
  const band = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 64))));

  const current = active !== null ? data[active] : null;
  const tipLeft = active !== null ? PAD.left + band * active + band / 2 : 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (!data.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setActive((i) => Math.min(data.length - 1, Math.max(0, (i ?? data.length - 1) + (i === null ? 0 : dir))));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(data.length - 1);
    else if (e.key === "Escape") setActive(null);
  }

  return (
    <figure className="m-0 min-w-0">
      <div ref={ref} className="relative w-full">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${label}. ${summary} Use arrow keys to read values.`}
          aria-describedby={summaryId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? data.length - 1)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke={CHART_GRID} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={CHART_AXIS} style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatTick(t, format)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            const h = Math.max(0, PAD.top + plotH - y(d.value));
            const r = Math.min(4, barW / 2, h);
            const top = PAD.top + plotH - h;
            const path =
              h > 0
                ? `M${x},${PAD.top + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${PAD.top + plotH} Z`
                : "";
            return (
              <g key={d.key}>
                {path && <path d={path} fill={CHART_ACCENT} opacity={active === null || active === i ? 1 : 0.45} />}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                />
                {i % labelEvery === 0 && (
                  <text x={PAD.left + band * i + band / 2} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill={CHART_AXIS}>
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="#cbd5e1"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        </svg>
        {current && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lift"
            style={{ left: Math.min(Math.max(tipLeft, 60), width - 60) }}
          >
            <p className="num text-sm font-semibold text-foreground">{formatValue(current.value, format)}</p>
            <p className="text-muted">{current.fullLabel}</p>
          </div>
        )}
      </div>
      <figcaption id={summaryId} className="mt-2 text-[13px] text-muted">
        {summary}
      </figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.fullLabel}</th>
              <td>{formatValue(d.value, format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
