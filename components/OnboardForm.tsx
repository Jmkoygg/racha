"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, Label } from "./ui";

export default function OnboardForm({ initialName = "", initialKey = "" }) {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "login">("create");

  // Estados de criação
  const [name, setName] = useState(initialName);
  const [pixKey, setPixKey] = useState(initialKey);
  const [pin, setPin] = useState("");

  // Estados de login de outro aparelho
  const [loginIdent, setLoginIdent] = useState("");
  const [loginPin, setLoginPin] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    if (pin && pin.trim().length > 0 && pin.trim().length < 4) {
      setErr("O PIN de segurança deve ter entre 4 e 8 dígitos.");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/organizer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, pixKey, pin: pin.trim() || undefined }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Não deu pra salvar.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const res = await fetch("/api/organizer/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: loginIdent, pin: loginPin }),
    });

    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d.error || "Identificador ou PIN incorretos.");
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Abas */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-sunk p-1 border border-line">
        <button
          type="button"
          onClick={() => {
            setTab("create");
            setErr(null);
          }}
          className={`rounded-lg py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
            tab === "create" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          }`}
        >
          Primeiro acesso
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setErr(null);
          }}
          className={`rounded-lg py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
            tab === "login" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          }`}
        >
          Entrar de outro celular
        </button>
      </div>

      {tab === "create" ? (
        <form onSubmit={save} className="flex flex-col gap-3.5">
          <div>
            <Label>Seu nome ou apelido</Label>
            <input
              className={inputClass()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da República"
              autoComplete="name"
            />
          </div>

          <div>
            <Label>Sua chave PIX</Label>
            <input
              className={inputClass()}
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Telefone, CPF, e-mail ou aleatória"
              inputMode="text"
              required
            />
            <span className="mt-1 block text-[11px] text-ink-faint">
              Para onde os pagamentos vão direto. Você pode alterar quando quiser.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>PIN de segurança (4 a 8 dígitos)</Label>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Recomendado
              </span>
            </div>
            <input
              className={inputClass()}
              type="password"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 1908"
              inputMode="numeric"
            />
            <span className="mt-1 block text-[11px] text-ink-faint">
              Usado para você acessar seus rachas se trocar ou perder o celular.
            </span>
          </div>

          {err && (
            <p className="text-xs font-semibold text-danger bg-danger-soft p-2.5 rounded-xl">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || pixKey.trim().length < 3}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-center font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Salvando…" : "Começar a rachar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <Label>Seu nome ou chave PIX cadastrada</Label>
            <input
              className={inputClass()}
              value={loginIdent}
              onChange={(e) => setLoginIdent(e.target.value)}
              placeholder="Ex: João da República ou sua chave PIX"
              required
            />
          </div>

          <div>
            <Label>Seu PIN de segurança</Label>
            <input
              className={inputClass()}
              type="password"
              maxLength={8}
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Digite o PIN de 4 a 8 dígitos"
              inputMode="numeric"
              required
            />
          </div>

          {err && (
            <p className="text-xs font-semibold text-danger bg-danger-soft p-2.5 rounded-xl">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || loginIdent.trim().length < 2 || loginPin.length < 4}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-center font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Entrando…" : "Restaurar meus rachas"}
          </button>
        </form>
      )}
    </div>
  );
}
