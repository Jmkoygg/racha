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

export default function NovaForm({ pixKey }: { pixKey: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [amountBasis, setAmountBasis] = useState<"total" | "perPerson">("total");
  const [people, setPeople] = useState(3);
  const [key, setKey] = useState(pixKey);
  const [mode, setMode] = useState<"equal" | "custom">("equal");
  const [customSlices, setCustomSlices] = useState<{ label: string; amount: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amountCents = parseCents(amountStr);
  const totalCents = amountBasis === "total" ? amountCents : amountCents * people;
  const perPerson = people > 0 ? Math.round(totalCents / people) : 0;

  function switchToCustom() {
    setMode("custom");
    setCustomSlices(
      Array.from({ length: people }, () => ({
        label: "",
        amount: (perPerson / 100).toFixed(2).replace(".", ","),
      })),
    );
  }
  function switchToEqual() {
    setMode("equal");
    setCustomSlices([]);
  }
  function setPeopleCount(n: number) {
    const v = Math.max(1, Math.min(60, n));
    setPeople(v);
    if (mode === "custom") {
      setCustomSlices((prev) => {
        const next = [...prev];
        while (next.length < v) next.push({ label: "", amount: "0,00" });
        return next.slice(0, v);
      });
    }
  }

  const customSum = useMemo(
    () => customSlices.reduce((a, s) => a + parseCents(s.amount), 0),
    [customSlices],
  );
  const customTotal = mode === "custom" ? customSum : totalCents;
  const customOk = mode === "equal" || Math.abs(customSum - totalCents) <= 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("Dá um nome pra cobrança.");
    if (totalCents <= 0) return setErr("Coloca o valor.");
    if (mode === "custom" && !customOk)
      return setErr(`As partes somam ${brl(customSum)}, mas o total é ${brl(totalCents)}.`);

    const slices =
      mode === "equal"
        ? splitEqually(totalCents, people)
        : customSlices.map((s) => ({
            label: s.label.trim() || null,
            amountCents: parseCents(s.amount),
          }));

    setBusy(true);
    const res = await fetch("/api/charges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        pixKey: key,
        splitMode: mode,
        totalCents: mode === "custom" ? customSum : totalCents,
        peopleCount: people,
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
        <Label>O que é?</Label>
        <input
          className={inputClass()}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lanche na cantina"
          autoFocus
        />
      </div>

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
          <div className="flex overflow-hidden rounded-xl border border-line text-sm font-semibold">
            {(["total", "perPerson"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setAmountBasis(b)}
                className={`px-3 ${amountBasis === b ? "bg-brand text-white" : "bg-surface text-ink-soft"}`}
              >
                {b === "total" ? "total" : "por pessoa"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Quantas pessoas?</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPeopleCount(people - 1)}
            className="h-11 w-11 rounded-xl border border-line text-xl font-bold text-ink-soft"
          >
            –
          </button>
          <span className="w-8 text-center text-2xl font-extrabold tabular-nums">{people}</span>
          <button
            type="button"
            onClick={() => setPeopleCount(people + 1)}
            className="h-11 w-11 rounded-xl border border-line text-xl font-bold text-ink-soft"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <Label>Sua chave PIX</Label>
        <input
          className={inputClass()}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="CPF, telefone, email ou aleatória"
        />
      </div>

      <div className="flex overflow-hidden rounded-xl border border-line text-sm font-semibold">
        <button
          type="button"
          onClick={switchToEqual}
          className={`flex-1 py-2.5 ${mode === "equal" ? "bg-brand text-white" : "bg-surface text-ink-soft"}`}
        >
          dividir igual
        </button>
        <button
          type="button"
          onClick={switchToCustom}
          className={`flex-1 py-2.5 ${mode === "custom" ? "bg-brand text-white" : "bg-surface text-ink-soft"}`}
        >
          valores diferentes
        </button>
      </div>

      {mode === "custom" && (
        <div className="flex flex-col gap-2 rounded-xl bg-sunk p-3">
          {customSlices.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                value={s.label}
                onChange={(e) => {
                  const n = [...customSlices];
                  n[i] = { ...n[i], label: e.target.value };
                  setCustomSlices(n);
                }}
                placeholder={`porção ${i + 1} (ex: com borda)`}
              />
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                  R$
                </span>
                <input
                  className="w-full rounded-lg border border-line bg-surface py-2.5 pl-8 pr-2 text-sm outline-none focus:border-brand"
                  value={s.amount}
                  inputMode="decimal"
                  onChange={(e) => {
                    const n = [...customSlices];
                    n[i] = { ...n[i], amount: e.target.value };
                    setCustomSlices(n);
                  }}
                />
              </div>
            </div>
          ))}
          <div
            className={`text-center text-xs font-semibold ${customOk ? "text-ink-faint" : "text-danger"}`}
          >
            partes: {brl(customSum)} / total: {brl(totalCents)}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-brand-soft px-4 py-3 text-center text-sm text-brand-dark">
        {mode === "equal" ? (
          <>
            Cada um paga <strong>{brl(perPerson)}</strong>. Você recebe até{" "}
            <strong>{brl(totalCents)}</strong>.
          </>
        ) : (
          <>
            {people} partes, de <strong>{brl(customTotal)}</strong> no total.
          </>
        )}
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-brand px-4 py-3.5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Criando…" : "Criar e compartilhar"}
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
