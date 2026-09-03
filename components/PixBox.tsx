"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PixBox({ brcode }: { brcode: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(brcode, { width: 480, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [brcode]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(brcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR Code PIX"
            width={210}
            height={210}
            className="h-[210px] w-[210px] rounded-xl"
          />
        ) : (
          <div className="h-[210px] w-[210px] animate-pulse rounded-xl bg-slate-100" />
        )}
      </div>

      <button
        type="button"
        onClick={copy}
        className="flex items-center justify-center gap-2 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-500/20 active:scale-[0.98]"
      >
        {copied ? (
          <span>✓ Código PIX Copiado!</span>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copiar chave Pix Copia e Cola</span>
          </>
        )}
      </button>
    </div>
  );
}
