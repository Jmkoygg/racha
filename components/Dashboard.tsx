"use client";

import { useEffect, useState, useCallback } from "react";
import ShareButtons from "./ShareButtons";
import { ChainBadge } from "./ui";

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Slice = {
  index: number;
  label: string | null;
  amountCents: number;
  status: string;
  payerName: string | null;
  paidAt: string | null;
  confirmedBy: string;
  chainUrl: string | null;
  proofUrl?: string | null;
};
type Charge = {
  slug: string;
  title: string;
  splitMode: string;
  totalCents: number;
  peopleCount: number;
  status: string;
  paidCents: number;
  chainUrl: string | null;
  slices: Slice[];
};

export default function Dashboard({
  initial,
  shareUrl,
  justCreated,
}: {
  initial: Charge;
  shareUrl: string;
  justCreated: boolean;
}) {
  const [charge, setCharge] = useState<Charge>(initial);
  const [busy, setBusy] = useState<number | "delete" | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/charges/${initial.slug}`, { cache: "no-store" });
    if (res.ok) setCharge(await res.json());
  }, [initial.slug]);

  useEffect(() => {
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const paidCount = charge.slices.filter((s) => s.status === "paid").length;
  const pct = Math.min(100, Math.round((charge.paidCents / charge.totalCents) * 100));

  const perPersonLabel =
    charge.splitMode === "equal"
      ? `${brl(Math.round(charge.totalCents / charge.peopleCount))} pra cada`
      : "Valor de acordo com sua parte";

  async function manualConfirm(index: number) {
    setBusy(index);
    await fetch(`/api/charges/${charge.slug}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ index }),
    });
    await refresh();
    setBusy(null);
  }

  async function removeCharge() {
    setBusy("delete");
    const res = await fetch(`/api/charges/${charge.slug}`, {
      method: "DELETE",
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = "/";
    } else {
      setBusy(null);
      alert(d.error || "Não foi possível excluir a cobrança.");
    }
  }

  const fullShareUrl =
    typeof window !== "undefined" && shareUrl.startsWith("/")
      ? `${window.location.origin}${shareUrl}`
      : shareUrl;

  const remindMsg = `Lembrete do racha de *${charge.title}*:\n\nQuem ainda não pagou, copia o PIX e anexa o comprovante por aqui:\n${fullShareUrl}`;
  const remindWa = `https://wa.me/?text=${encodeURIComponent(remindMsg)}`;

  return (
    <div className="flex flex-col gap-5">
      {justCreated && (
        <div className="rise flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
            <span className="text-sm font-bold">Racha criado com sucesso!</span>
          </div>
          {charge.chainUrl && (
            <ChainBadge href={charge.chainUrl} label="On-chain" />
          )}
        </div>
      )}

      {/* Card principal de Arrecadação */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Total Arrecadado
          </span>
          <span className="rounded-full bg-sunk px-2.5 py-1 text-xs font-bold text-ink">
            {paidCount} de {charge.peopleCount} pagaram
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-black text-brand">
            {brl(charge.paidCents)}
          </span>
          <span className="text-base font-bold text-ink-faint">
            de {brl(charge.totalCents)}
          </span>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-sunk">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500 shadow-sm"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
          <span className="text-xs text-ink-faint">Racha: <strong className="text-ink font-semibold">{charge.title}</strong></span>
          {charge.chainUrl && (
            <ChainBadge href={charge.chainUrl} label="Solana Devnet" />
          )}
        </div>
      </div>

      {/* Bloco de Compartilhamento */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Mandar pro grupo
          </span>
        </div>
        <ShareButtons url={shareUrl} title={charge.title} perPersonLabel={perPersonLabel} />
      </div>

      {/* Lista de Vagas / Quem Pagou */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Participantes ({charge.slices.length})
          </span>
          <span className="text-xs text-ink-faint">Atualiza sozinho</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {charge.slices.map((s) => {
            const isPaid = s.status === "paid";
            return (
              <li
                key={s.index}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  isPaid
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      isPaid
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "bg-sunk text-ink-soft"
                    }`}
                  >
                    {isPaid ? "✓" : s.index}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink text-sm flex items-center gap-1.5">
                      <span>{s.payerName || `Amigo ${s.index}`}</span>
                      {s.label && (
                        <span className="text-[10px] font-semibold text-ink-faint bg-sunk px-1.5 py-0.5 rounded">
                          {s.label}
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-medium text-ink-faint">
                      {isPaid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Pago{s.confirmedBy === "manual" ? " (manual)" : ""}
                          {s.paidAt
                            ? " às " +
                              new Date(s.paidAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      ) : s.status === "mismatch" ? (
                        <span className="text-amber-500">Divergência no valor</span>
                      ) : (
                        "Aguardando PIX..."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-black text-ink">{brl(s.amountCents)}</span>
                  {s.proofUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingProof(s.proofUrl!)}
                      title="Ver print do comprovante enviado"
                      className="flex h-7 items-center gap-1 rounded-lg bg-sunk px-2 text-[11px] font-bold text-ink-soft hover:text-ink hover:bg-surface border border-line transition cursor-pointer active:scale-95"
                    >
                      <span>👁️</span>
                      <span>Print</span>
                    </button>
                  )}
                  {isPaid && s.chainUrl && (
                    <a
                      href={s.chainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver recibo on-chain na Solana"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-chain-soft text-chain transition hover:opacity-80 active:scale-95"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {!isPaid && (
                    <span className="rounded-full bg-sunk px-2.5 py-1 text-[11px] font-semibold text-ink-faint">
                      Pendente
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modal de visualização do comprovante para o Organizador */}
      {viewingProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setViewingProof(null)}
        >
          <div
            className="relative max-w-sm w-full rounded-3xl bg-surface border border-line p-4 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span>📄</span>
                <span>Comprovante enviado pelo amigo</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="text-xs font-bold text-ink-faint hover:text-ink px-2 py-1 rounded-lg bg-sunk cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line max-h-[70vh] flex items-center justify-center bg-black/5 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingProof}
                alt="Comprovante de pagamento"
                className="object-contain w-full max-h-[68vh] rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Ações Extras */}
      <div className="flex flex-col gap-3 pt-2">
        {paidCount < charge.peopleCount && (
          <a
            href={remindWa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3.5 text-center text-sm font-bold text-ink transition hover:bg-sunk active:scale-[0.98]"
          >
            <span>👀</span>
            <span>Cobrar quem ainda não pagou no WhatsApp</span>
          </a>
        )}

        {/* Conclusão automática: aparece quando todo mundo pagou */}
        {(charge.status === "settled" || paidCount === charge.peopleCount) && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span>🎉</span>
            <span>Racha 100% concluído! Todos os amigos pagaram.</span>
          </div>
        )}

        {/* Opção de Excluir cobrança: APENAS quando ninguém pagou ainda */}
        {paidCount === 0 && (
          <div className="pt-2 border-t border-line/60">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface py-2.5 text-center text-xs font-semibold text-ink-faint hover:text-danger hover:border-danger/40 transition cursor-pointer"
              >
                <span>🗑️</span>
                <span>Excluir este racha</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-danger/30 bg-danger/5 p-3.5 flex flex-col gap-2.5 text-center animate-in fade-in">
                <p className="text-xs font-bold text-ink">
                  Tem certeza que deseja excluir este racha?
                </p>
                <p className="text-[11px] text-ink-faint">
                  Nenhum pagamento foi realizado ainda. A cobrança será cancelada e apagada.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy === "delete"}
                    className="rounded-xl border border-line bg-surface py-2 text-xs font-bold text-ink hover:bg-sunk cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={removeCharge}
                    disabled={busy === "delete"}
                    className="rounded-xl bg-danger py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {busy === "delete" ? "Excluindo..." : "Sim, excluir"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
