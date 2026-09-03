import Link from "next/link";
import { getOrganizer } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pix";
import { Card, Navbar, ChainBadge } from "@/components/ui";
import LandingPage from "@/components/LandingPage";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const organizer = await getOrganizer();

  if (!organizer) {
    return <LandingPage />;
  }

  const charges = await prisma.charge.findMany({
    where: { organizerId: organizer.id },
    include: { slices: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="rise flex flex-col gap-5 pb-8">
      <Navbar
        right={
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sunk text-ink-soft">
              {organizer.name || "Organizador"}
            </span>
            <LogoutButton />
          </div>
        }
      />

      {/* Botão de Criação */}
      <Link
        href="/nova"
        className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-center font-bold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[0.98] hover:shadow-emerald-600/35"
      >
        <span className="text-lg leading-none">+</span>
        <span>Nova cobrança de racha</span>
      </Link>

      {/* Seus Rachas */}
      {charges.length === 0 ? (
        <Card className="text-center text-ink-soft py-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sunk text-2xl">
            🍕
          </div>
          <p className="font-bold text-ink">Nenhum racha ativo ainda</p>
          <p className="mt-1 text-sm text-ink-soft">
            Exemplo: <em>&ldquo;Churrasco da república&rdquo;</em> ou <em>&ldquo;Almoço na cantina&rdquo;</em>.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Seus Rachas Ativos ({charges.length})
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {charges.map((c) => {
              const paid = c.slices.filter((s) => s.status === "paid").length;
              const paidCents = c.slices
                .filter((s) => s.status === "paid")
                .reduce((a, s) => a + (s.proofAmountCents ?? s.amountCents), 0);
              const pct = Math.min(100, Math.round((paidCents / c.totalCents) * 100));

              return (
                <li key={c.id}>
                  <Link href={`/r/${c.slug}/painel`}>
                    <Card className="transition active:scale-[0.99] hover:border-emerald-500/30">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-ink text-base">{c.title}</span>
                        <span className="text-base font-extrabold text-brand">
                          {formatBRL(c.totalCents)}
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunk">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="mt-2.5 flex justify-between items-center text-xs font-medium text-ink-faint">
                        <span>
                          <strong className="text-ink font-bold">{paid}</strong> de {c.peopleCount} pagaram
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            c.status === "settled"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-sunk text-ink-soft"
                          }`}
                        >
                          {c.status === "settled" ? "Quitada ✓" : "Aberta"}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
