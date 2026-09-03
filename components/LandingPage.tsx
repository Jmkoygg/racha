"use client";

import { useState } from "react";
import { Navbar, Card, ChainBadge } from "./ui";
import OnboardForm from "./OnboardForm";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"racha" | "cofre">("racha");

  return (
    <div className="rise flex flex-col gap-8 pb-8">
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col gap-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/20">
            <span>🇧🇷</span>
            <span>Feito para universitários</span>
          </span>
          <ChainBadge label="Auditado na Solana" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.15] text-ink">
          Racha a conta no PIX. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Guarda o caixa sem calote.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          Chega de <em>&ldquo;paga 11 pro Erick e 6,20 pro Gabriel&rdquo;</em> e do medo do dinheiro da turma sumir no Tigrinho. 
          O app para repúblicas, churrascos e caixas de formatura com <strong>registro imutável na Solana</strong>.
        </p>
      </section>

      {/* Card de Início Rápido / Onboarding */}
      <Card className="border-emerald-500/20 shadow-xl shadow-emerald-500/5 bg-surface/90 backdrop-blur-sm">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
            Comece em 15 segundos
          </span>
          <h2 className="text-lg font-extrabold text-ink mt-0.5">
            Criar seu primeiro racha
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Sem cadastro longo ou senha. Coloque seu nome e sua chave PIX para receber os pagamentos direto no seu banco.
          </p>
        </div>
        <OnboardForm />
      </Card>

      {/* Seletor dos 2 Modos */}
      <section className="flex flex-col gap-4">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Como funciona
          </span>
          <h2 className="text-xl font-black text-ink">
            A solução completa para o seu grupo
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sunk p-1.5 border border-line">
          <button
            type="button"
            onClick={() => setActiveTab("racha")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "racha"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <span>🍕</span>
            <span>Modo Racha</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cofre")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cofre"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <span>🛡️</span>
            <span>Modo Cofre</span>
          </button>
        </div>

        {activeTab === "racha" ? (
          <div className="rise flex flex-col gap-3">
            <div className="rounded-2xl border border-line bg-surface p-4 flex gap-3.5 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-400">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Cria a cobrança em 15 segundos</h3>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  Lança o valor total (ex: R$ 45 no almoço da cantina), divide igualmente ou personaliza o que cada um consumiu.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 flex gap-3.5 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-400">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Manda 1 link no grupo do Zap</h3>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  Seus amigos clicam e já veem o valor exato e o QR Code. Pagam pelo Nubank, Inter ou qualquer banco <strong>sem precisar baixar nenhum app</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 flex gap-3.5 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-400">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Painel em tempo real + OCR</h3>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  Quem pagou envia o print ou você confirma em 1 clique. O comprovante vira um recibo público e permanente na blockchain Solana.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rise flex flex-col gap-3">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                <span>🛡️ Proteção Anti-Tigrinho</span>
              </div>
              <h3 className="text-base font-extrabold text-ink">
                O fim do dinheiro da turma sumindo na conta de uma pessoa
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Em bancos tradicionais, o caixa da república, da atlética ou da formatura fica no CPF de <strong>um único tesoureiro</strong>. 
                Se essa pessoa tiver um surto, tomar golpe ou apostar no Tigrinho, a turma perde tudo.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 flex gap-3.5 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-sm font-black text-purple-600 dark:text-purple-400">
                🗝️
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Cofre Multi-Assinatura (Squads)</h3>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  O dinheiro só pode ser movimentado se a maioria da diretoria assinar (ex: 2 de 3). Ninguém saca sozinho.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 flex gap-3.5 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-sm font-black text-purple-600 dark:text-purple-400">
                📊
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Transparência pública e perpétua</h3>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  Todos os formandos ou moradores da república enxergam cada entrada e saída on-chain. Trocou a gestão? O histórico e os fundos continuam protegidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Por que na Solana? */}
      <section className="rounded-3xl border border-line bg-surface p-5 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
          Por que usamos a Solana?
        </span>
        <h2 className="text-base font-extrabold text-ink">
          PIX transfere dinheiro. A Solana garante a verdade.
        </h2>
        <p className="text-xs text-ink-soft leading-relaxed">
          O PIX é excelente para mandar dinheiro rápido, mas bancos tradicionais não guardam um histórico compartilhado neutro, nem criam cofres conjuntos sem a burocracia de abrir empresa em cartório.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-2xl bg-sunk/60 p-3.5 border border-line/60">
            <span className="text-sm font-bold text-ink block">⚡ Barata e Instantânea</span>
            <span className="text-xs text-ink-soft mt-1 block">
              Confirmação em segundos e custo de frações de centavo por registro de pagamento.
            </span>
          </div>
          <div className="rounded-2xl bg-sunk/60 p-3.5 border border-line/60">
            <span className="text-sm font-bold text-ink block">📜 Score de Confiança</span>
            <span className="text-xs text-ink-soft mt-1 block">
              Seu histórico de pagador pontual fica gravado on-chain e segue você mesmo se trocar de república.
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Rápido */}
      <section className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-faint px-1">
          Dúvidas frequentes
        </span>

        <details className="group rounded-2xl border border-line bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-ink">
            <span>Preciso entender de criptomoeda para usar?</span>
            <span className="transition group-open:rotate-180 text-ink-faint text-xs">▼</span>
          </summary>
          <p className="mt-2 text-xs text-ink-soft leading-relaxed">
            Não! Para quem racha a conta no dia a dia, a experiência é 100% em reais pelo PIX tradicional no banco que você já usa no celular. A blockchain roda de forma transparente por baixo dos panos.
          </p>
        </details>

        <details className="group rounded-2xl border border-line bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-ink">
            <span>Quanto custa usar o Racha?</span>
            <span className="transition group-open:rotate-180 text-ink-faint text-xs">▼</span>
          </summary>
          <p className="mt-2 text-xs text-ink-soft leading-relaxed">
            É 100% gratuito. O dinheiro vai direto da conta do pagador para a chave PIX do organizador sem taxa de intermediação.
          </p>
        </details>
      </section>

      {/* Footer */}
      <footer className="pt-4 border-t border-line text-center text-xs text-ink-faint flex flex-col items-center gap-1">
        <p>Desenvolvido para a <strong>Hackathon Universitária Superteam Brasil</strong>.</p>
        <p className="text-[11px] opacity-80">Solana Devnet • Registros via SPL Memo &amp; Squads Protocol</p>
      </footer>
    </div>
  );
}
