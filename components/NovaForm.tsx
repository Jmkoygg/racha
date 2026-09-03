"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, Label } from "./ui";

function parseCents(v: string): number {
  const clean = v.replace(/\s/g, "").replace(/[R$]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CustomGroup {
  label: string;
  amount: string;
  count: number;
}

export default function NovaForm({ pixKey }: { pixKey: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [key, setKey] = useState(pixKey);
  const [mode, setMode] = useState<"equal" | "custom">("equal");

  // Modo Dividir Igual
  const [amountStr, setAmountStr] = useState("");
  const [amountBasis, setAmountBasis] = useState<"total" | "perPerson">("total");
  const [people, setPeople] = useState(3);

  // Modo Tipos de Consumo (Custom)
  const [groups, setGroups] = useState<CustomGroup[]>([
    { label: "Só comida", amount: "15,00", count: 3 },
    { label: "Comida + Bebida", amount: "25,00", count: 2 },
  ]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Cálculos do modo igual
  const equalAmountCents = parseCents(amountStr);
  const equalTotalCents = amountBasis === "total" ? equalAmountCents : equalAmountCents * people;
  const equalPerPerson = people > 0 ? Math.round(equalTotalCents / people) : 0;

  // Cálculos do modo tipos de consumo
  const customTotalCents = useMemo(() => {
    return groups.reduce((acc, g) => acc + parseCents(g.amount) * g.count, 0);
  }, [groups]);

  const customTotalPeople = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.count, 0);
  }, [groups]);

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { label: `Opção ${prev.length + 1}`, amount: "10,00", count: 1 },
    ]);
  }

  function removeGroup(idx: number) {
    if (groups.length <= 1) return;
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateGroup(idx: number, patch: Partial<CustomGroup>) {
    setGroups((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!title.trim()) return setErr("Dá um nome pra cobrança (ex: Pizzas da sexta).");
    if (!key.trim()) return setErr("Informe a sua chave PIX.");

    let totalCents = 0;
    let peopleCount = 0;
    let slices: { label: string | null; amountCents: number }[] = [];

    if (mode === "equal") {
      if (equalTotalCents <= 0) return setErr("Coloque o valor do racha.");
      totalCents = equalTotalCents;
      peopleCount = people;
      slices = splitEqually(totalCents, people);
    } else {
      if (customTotalCents <= 0) return setErr("Preencha os valores dos tipos de consumo.");
      if (customTotalPeople <= 0) return setErr("A quantidade de pessoas deve ser maior que zero.");

      totalCents = customTotalCents;
      peopleCount = customTotalPeople;

      // Gera as fatias para cada grupo
      for (const g of groups) {
        const itemCents = parseCents(g.amount);
        const itemLabel = g.label.trim() || "Consumo";
        for (let i = 0; i < g.count; i++) {
          slices.push({
            label: itemLabel,
            amountCents: itemCents,
          });
        }
      }
    }

    setBusy(true);
    const res = await fetch("/api/charges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        pixKey: key.trim(),
        splitMode: mode,
        totalCents,
        peopleCount,
        slices,
      }),
    });

    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d.error || "Não deu pra criar.");
      setBusy(false);
      return;
    }
    router.push(`/r/${d.slug}/painel?novo=1`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <Label>O que é o racha?</Label>
        <input
          className={inputClass()}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Pizzas da sexta, Cantina, Churrasco"
          autoFocus
          required
        />
      </div>

      <div>
        <Label>Sua chave PIX para receber</Label>
        <input
          className={inputClass()}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="CPF, telefone, email ou aleatória"
          required
        />
      </div>

      {/* Seletor de Modo de Divisão */}
      <div>
        <Label>Como vai dividir a conta?</Label>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-sunk p-1 border border-line">
          <button
            type="button"
            onClick={() => setMode("equal")}
            className={`rounded-lg py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              mode === "equal" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Dividir igual
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-lg py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              mode === "custom" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Por tipo de consumo
          </button>
        </div>
      </div>

      {mode === "equal" ? (
        <div className="rise flex flex-col gap-4">
          <div>
            <Label>Valor</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                  R$
                </span>
                <input
                  className={inputClass() + " pl-9"}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </div>
              <div className="flex overflow-hidden rounded-xl border border-line text-xs font-bold">
                {(["total", "perPerson"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setAmountBasis(b)}
                    className={`px-3 py-2 cursor-pointer transition ${
                      amountBasis === b ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-surface text-ink-soft"
                    }`}
                  >
                    {b === "total" ? "total" : "por pessoa"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Quantas pessoas na conta?</Label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPeople(Math.max(2, people - 1))}
                className="h-11 w-11 rounded-xl border border-line bg-surface text-xl font-bold text-ink hover:bg-sunk active:scale-95 cursor-pointer"
              >
                –
              </button>
              <span className="w-10 text-center text-2xl font-extrabold tabular-nums">{people}</span>
              <button
                type="button"
                onClick={() => setPeople(Math.min(60, people + 1))}
                className="h-11 w-11 rounded-xl border border-line bg-surface text-xl font-bold text-ink hover:bg-sunk active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 text-center text-xs text-ink-soft">
            Cada um paga <strong className="text-ink font-bold">{brl(equalPerPerson)}</strong>. Total arrecadado:{" "}
            <strong className="text-ink font-bold">{brl(equalTotalCents)}</strong>.
          </div>
        </div>
      ) : (
        <div className="rise flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink">Quem consumiu o quê?</span>
              <p className="text-[11px] text-ink-faint">
                Crie as opções (ex: quem só comeu vs quem bebeu refri/cerveja).
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {groups.map((g, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-surface p-3.5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-line bg-sunk px-3 py-2 text-xs font-bold outline-none focus:border-brand"
                    value={g.label}
                    onChange={(e) => updateGroup(idx, { label: e.target.value })}
                    placeholder="Nome da opção (ex: Só comida, Comida + Bebida)"
                  />
                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGroup(idx)}
                      title="Remover opção"
                      className="text-xs text-ink-faint hover:text-danger p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="block text-[10px] font-semibold text-ink-faint mb-1">
                      Valor por pessoa
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                        R$
                      </span>
                      <input
                        className="w-full rounded-xl border border-line bg-surface py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-brand"
                        value={g.amount}
                        inputMode="decimal"
                        onChange={(e) => updateGroup(idx, { amount: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-ink-faint mb-1">
                      Pessoas nessa opção
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateGroup(idx, { count: Math.max(1, g.count - 1) })}
                        className="h-8 w-8 rounded-lg border border-line text-sm font-bold text-ink hover:bg-sunk cursor-pointer"
                      >
                        –
                      </button>
                      <span className="w-5 text-center text-sm font-extrabold">{g.count}</span>
                      <button
                        type="button"
                        onClick={() => updateGroup(idx, { count: g.count + 1 })}
                        className="h-8 w-8 rounded-lg border border-line text-sm font-bold text-ink hover:bg-sunk cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addGroup}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line p-2.5 text-xs font-bold text-ink-soft hover:bg-sunk hover:text-ink cursor-pointer transition"
          >
            <span>+</span>
            <span>Adicionar outra opção de consumo</span>
          </button>

          <div className="rounded-2xl border border-line bg-surface p-4 text-center text-xs text-ink-soft">
            Total de <strong className="text-ink font-bold">{customTotalPeople} pessoas</strong> no racha • Arrecadação total:{" "}
            <strong className="text-ink font-bold">{brl(customTotalCents)}</strong>
          </div>
        </div>
      )}

      {err && <p className="text-xs font-semibold text-danger bg-danger-soft p-3 rounded-xl">{err}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-center font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Criando racha na Solana…" : "Criar e pegar link do WhatsApp"}
      </button>
    </form>
  );
}

function splitEqually(total: number, n: number) {
  const base = Math.floor(total / n);
  const rest = total - base * n;
  return Array.from({ length: n }, (_, i) => ({
    label: null,
    amountCents: base + (i < rest ? 1 : 0),
  }));
}
