import type { SVGProps } from "react";
import Link from "next/link";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandMark() {
  return (
    <span
      className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-600"
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-5" fill="none">
        <path
          d="M6 16c3.2-4.7 7-7 11.4-7 3.5 0 6.4 1.6 8.6 4.7-2.2 3.1-5.1 4.7-8.6 4.7C13 18.4 9.2 16.1 6 11.4c-.9 1.8-.9 7.4 0 9.2C9.2 15.9 13 13.6 17.4 13.6c3.5 0 6.4 1.6 8.6 4.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20.5" cy="13.1" r="1.1" fill="currentColor" />
      </svg>
    </span>
  );
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-stone-200/80 bg-white/90 dark:border-white/10 dark:bg-stone-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <BrandMark />
          <span className="text-base font-semibold text-stone-950 dark:text-white">
            Fisheye
          </span>
        </Link>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6" /></IconBase>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <IconBase {...props}><path d="m15 18-6-6 6-6" /></IconBase>;
}

export function WaterIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z" /><path d="M9 15.5c.5 1.2 1.5 1.8 3 1.8" /></IconBase>;
}

export function ScaleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 20h12M12 3v17M5 7h14M5 7l-3 6h6L5 7ZM19 7l-3 6h6l-3-6Z" /></IconBase>;
}

export function FeedIcon(props: IconProps) {
  return <IconBase {...props}><path d="M7 4h10l2 5-2 11H7L5 9l2-5Z" /><path d="M5 9h14M9 13h6" /></IconBase>;
}

export function FishIcon(props: IconProps) {
  return <IconBase {...props}><path d="M18 12c-2.2-3-5-4.5-8.5-4.5C6 7.5 3.5 9 2 12c1.5 3 4 4.5 7.5 4.5S15.8 15 18 12Z" /><path d="m18 12 4-4v8l-4-4Z" /><circle cx="7" cy="11" r=".6" fill="currentColor" stroke="none" /></IconBase>;
}

export function CalendarIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 3v3M18 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></IconBase>;
}

export function PlusIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>;
}

export function ChartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></IconBase>;
}

export function PackageIcon(props: IconProps) {
  return <IconBase {...props}><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></IconBase>;
}

export function SparkleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 3c.5 4.3 2.7 6.5 7 7-4.3.5-6.5 2.7-7 7-.5-4.3-2.7-6.5-7-7 4.3-.5 6.5-2.7 7-7Z" /><path d="M19 16c.2 1.8 1.2 2.8 3 3-1.8.2-2.8 1.2-3 3-.2-1.8-1.2-2.8-3-3 1.8-.2 2.8-1.2 3-3Z" /></IconBase>;
}

export function CheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 12 4 4L19 6" /></IconBase>;
}
