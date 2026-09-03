"use client";

import { useState } from "react";

export default function ShareButtons({
  url,
  title,
  perPersonLabel,
}: {
  url: string;
  title: string;
  perPersonLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const msg = `💸 *Racha — ${title}*\n${perPersonLabel}\nPaga aqui pelo PIX 👉 ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105 active:scale-[0.98]"
      >
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
        <span>Compartilhar no WhatsApp</span>
      </a>

      <button
        onClick={copy}
        className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sunk active:scale-[0.98]"
      >
        {copied ? (
          <>
            <span className="text-emerald-500 font-bold">✓ Link copiado!</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copiar link do racha</span>
          </>
        )}
      </button>
    </div>
  );
}
