import Link from "next/link";
import type { ReactNode } from "react";
import { TrendDownIcon, TrendUpIcon } from "./icons";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const SERIES_COUNT = 8;

// Stable colour per feed type so a type looks the same on every chart.
export function feedColor(feedTypeId: number | null | undefined) {
  if (!feedTypeId) return "var(--ink-3)";
  return `var(--series-${((feedTypeId - 1) % SERIES_COUNT) + 1})`;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-xs",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-base",
    variant === "primary" && "bg-brand text-brand-ink shadow-sm hover:bg-brand-strong",
    variant === "secondary" &&
      "border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-surface-2",
    variant === "ghost" && "text-ink-2 hover:bg-surface-3 hover:text-ink",
    variant === "danger" && "border border-line bg-surface text-danger hover:bg-danger-soft",
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink tabular-nums shadow-xs placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none";

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,30,35,0.04)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-pretty text-sm text-ink-3">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-sm font-medium text-brand">{eyebrow}</div>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-pretty text-sm text-ink-2">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type Tone = "neutral" | "brand" | "positive" | "warning" | "danger" | "info";

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-2",
  brand: "bg-brand-soft text-brand",
  positive: "bg-positive-soft text-positive",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  unit,
  sub,
  icon,
  change,
  emphasis = false,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: ReactNode;
  icon?: ReactNode;
  change?: { value: number; label: string; goodWhen: "up" | "down" } | null;
  emphasis?: boolean;
}) {
  const isUp = change ? change.value >= 0 : false;
  const isGood = change ? (change.goodWhen === "up" ? isUp : !isUp) : false;

  return (
    <Card
      as="div"
      className={cx(
        "relative overflow-hidden p-5",
        emphasis && "border-transparent bg-linear-to-br from-[#0d7480] to-[#0a4f59] text-white",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cx("text-sm font-medium", emphasis ? "text-white/80" : "text-ink-2")}>{label}</p>
        {icon && (
          <span
            className={cx(
              "flex size-8 items-center justify-center rounded-lg",
              emphasis ? "bg-white/15 text-white" : "bg-surface-3 text-ink-2",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cx(
          "mt-3 text-[26px] leading-none font-semibold tracking-tight tabular-nums",
          emphasis ? "text-white" : "text-ink",
        )}
      >
        {value}
        {unit && (
          <span className={cx("ml-1 text-base font-medium", emphasis ? "text-white/70" : "text-ink-3")}>
            {unit}
          </span>
        )}
      </p>
      <div className={cx("mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", emphasis ? "text-white/75" : "text-ink-3")}>
        {change && Number.isFinite(change.value) && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 font-medium",
              emphasis ? "text-white" : isGood ? "text-positive" : "text-danger",
            )}
          >
            {isUp ? <TrendUpIcon className="size-3.5" /> : <TrendDownIcon className="size-3.5" />}
            {`${isUp ? "+" : ""}${(change.value * 100).toFixed(1)}%`}
          </span>
        )}
        {change && <span>{change.label}</span>}
        {sub && <span>{sub}</span>}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && (
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-3 text-ink-3">
          {icon}
        </span>
      )}
      <h3 className="mt-4 text-balance font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-pretty text-sm text-ink-3">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function Tabs({
  items,
  active,
}: {
  items: { key: string; label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <nav className="-mx-4 mb-6 overflow-x-auto px-4 shadow-[inset_0_-1px_0_var(--line)] sm:mx-0 sm:px-0" aria-label="Sections">
      <ul className="flex min-w-max gap-6">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "inline-flex h-11 items-center gap-2 border-b-2 text-sm font-medium",
                  isActive
                    ? "border-brand text-ink"
                    : "border-transparent text-ink-3 hover:border-line-strong hover:text-ink-2",
                )}
              >
                {item.label}
                {item.count !== undefined && (
                  <span className="rounded-full bg-surface-3 px-1.5 text-xs text-ink-3 tabular-nums">
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
