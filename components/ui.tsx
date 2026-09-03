import Link from "next/link";
import { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

export function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 transition active:scale-98">
      <div
        className={`relative grid place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 font-extrabold text-white shadow-md shadow-emerald-500/25 ${
          small ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"
        }`}
      >
        <span className="font-mono tracking-tighter">R/</span>
      </div>
      <div className="flex flex-col">
        <span className={`font-black tracking-tight leading-none ${small ? "text-lg" : "text-xl"}`}>
          Racha
        </span>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-ink-faint">
          on Solana
        </span>
      </div>
    </Link>
  );
}

export function Navbar({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between pb-2">
      <Logo />
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-line bg-surface p-5 shadow-sm transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-faint">
      {children}
    </span>
  );
}

export function inputClass() {
  return "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base font-medium text-ink outline-none transition-all placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-emerald-500/10";
}

export function ChainBadge({ href, label = "registrado na Solana" }: { href?: string | null; label?: string }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-chain-soft px-3 py-1 text-xs font-semibold text-chain backdrop-blur-sm transition hover:border-purple-500/40">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
      </span>
      {label}
      {href && (
        <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </span>
  );
  if (!href) return inner;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block transition active:scale-95">
      {inner}
    </a>
  );
}
