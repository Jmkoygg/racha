"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, Label } from "./ui";

export default function OnboardForm({ initialName = "", initialKey = "" }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pixKey, setPixKey] = useState(initialKey);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/organizer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, pixKey }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Não deu pra salvar.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div>
        <Label>Seu nome</Label>
        <input
          className={inputClass()}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você aparece pra galera"
          autoComplete="name"
        />
      </div>
      <div>
        <Label>Sua chave PIX</Label>
        <input
          className={inputClass()}
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="CPF, telefone, email ou chave aleatória"
          inputMode="text"
          required
        />
        <span className="mt-1.5 block text-xs text-ink-faint">
          É pra onde a galera vai te pagar. Fica salva, você não digita de novo.
        </span>
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button
        type="submit"
        disabled={busy || pixKey.trim().length < 3}
        className="rounded-xl bg-brand px-4 py-3.5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Começar"}
      </button>
    </form>
  );
}
