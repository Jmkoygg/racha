"use client";

import { useMemo, useRef, useState } from "react";
import PixBox from "./PixBox";
import { ChainBadge } from "./ui";

type Slice = {
  index: number;
  label: string | null;
  amountCents: number;
  status: string;
  brcode: string;
};

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PayFlow({
  slug,
  title,
  splitMode,
  slices,
  paidCount,
  peopleCount,
}: {
  slug: string;
  title: string;
  splitMode: string;
  slices: Slice[];
  paidCount: number;
  peopleCount: number;
}) {
  const pending = slices.filter((s) => s.status !== "paid");
  const firstPending = pending[0];

  const [picked, setPicked] = useState<number | null>(
    splitMode === "equal" ? (firstPending?.index ?? null) : null,
  );
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [chainUrl, setChainUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Agrupa as fatias por tipo de consumo (label + valor)
  const groupOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        amountCents: number;
        availableSliceIndex: number | null;
        total: number;
        remaining: number;
      }
    >();

    for (const s of slices) {
      const key = `${s.label || "Consumo"}_${s.amountCents}`;
      const existing = map.get(key);
      const isPending = s.status !== "paid";

      if (!existing) {
        map.set(key, {
          label: s.label || "Consumo",
          amountCents: s.amountCents,
          availableSliceIndex: isPending ? s.index : null,
          total: 1,
          remaining: isPending ? 1 : 0,
        });
      } else {
        existing.total += 1;
        if (isPending) {
          existing.remaining += 1;
          if (existing.availableSliceIndex === null) {
            existing.availableSliceIndex = s.index;
          }
        }
      }
    }

    return Array.from(map.values());
  }, [slices]);

  const slice = slices.find((s) => s.index === picked) ?? null;

  if (paidCount >= peopleCount && !slice) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-lg font-bold text-brand">Todo mundo já pagou 🎉</p>
        <p className="mt-1 text-sm text-ink-soft">{title}</p>
      </div>
    );
  }

  if (!slice) {
    return (
      <div className="rise flex flex-col gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            O que você consumiu?
          </span>
          <h2 className="text-base font-extrabold text-ink mt-0.5">
            Selecione a sua parte para pagar
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {groupOptions.map((opt, i) => {
            const isAvailable = opt.availableSliceIndex !== null;
            return (
              <button
                key={i}
                disabled={!isAvailable}
                onClick={() => opt.availableSliceIndex !== null && setPicked(opt.availableSliceIndex)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                  isAvailable
                    ? "border-line bg-surface hover:border-emerald-500/40 hover:bg-sunk active:scale-[0.99] cursor-pointer"
                    : "border-line/40 bg-sunk/50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div>
                  <span className="block text-sm font-bold text-ink">{opt.label}</span>
                  <span className="text-[11px] text-ink-faint">
                    {isAvailable ? `${opt.remaining} de ${opt.total} vagas restantes` : "Esgotado / Já pago"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {brl(opt.amountCents)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  async function sendProof(dataUrl: string, isSimulation = false) {
    setPhase("checking");
    setMsg(null);
    try {
      const res = await fetch(`/api/charges/${slug}/proof`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sliceIndex: slice!.index,
          image: dataUrl,
          payerName: name,
          isSimulation,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        setPhase("done");
        setChainUrl(d.chainUrl ?? null);
      } else {
        setPhase("error");
        setMsg(d.message || "Não foi possível confirmar o comprovante.");
      }
    } catch {
      setPhase("error");
      setMsg("Erro de conexão ao enviar comprovante.");
    }
  }

  function upload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sendProof(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  if (phase === "done") {
    return (
      <div className="rise flex flex-col items-center gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-lg shadow-emerald-500/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-md shadow-emerald-500/30 animate-bounce">
          ✓
        </div>
        <div>
          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            Pagamento Confirmado!
          </h2>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            {brl(slice.amountCents)} conferido com sucesso{name ? ` para ${name}` : ""}.
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2">
          <span className="text-xs text-ink-faint">Registro imutável na blockchain:</span>
          <ChainBadge href={chainUrl} label="Comprovante na Solana Devnet" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {splitMode === "custom" && pending.length > 1 && (
        <div className="text-left px-1">
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>Escolher outra parte</span>
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <span className="block text-center text-xs font-bold uppercase tracking-wider text-ink-faint">
          {slice.label ? slice.label : "Sua parte no racha"}
        </span>
        <p className="mt-1 text-center text-4xl font-black tracking-tight text-ink">
          {brl(slice.amountCents)}
        </p>

        <div className="mt-5">
          <PixBox brcode={slice.brcode} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome ou apelido (pra aparecer no painel)"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-emerald-500/10 placeholder:text-ink-faint"
        />
      </div>

      {phase === "error" && msg && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-600 dark:text-red-400">
          <span>⚠️</span>
          <span>{msg}</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={phase === "checking"}
        className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-center font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-75 cursor-pointer"
      >
        {phase === "checking" ? (
          <>
            <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Lendo comprovante com OCR...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Já paguei — Enviar print do comprovante</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-faint pt-1">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
        <span>{paidCount} de {peopleCount} amigos já pagaram</span>
      </div>
    </div>
  );
}
