import { notFound } from "next/navigation";
import Link from "next/link";
import { getChargeBySlug } from "@/lib/charges";
import { getOrganizerId } from "@/lib/session";
import { buildBrCode } from "@/lib/pix";
import { Navbar, ChainBadge } from "@/components/ui";
import PayFlow from "@/components/PayFlow";
import { explorerTxUrl } from "@/lib/solana";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const charge = await getChargeBySlug(slug);
  if (!charge) notFound();

  const organizerId = await getOrganizerId();
  const isOrganizer = organizerId === charge.organizerId;

  const slices = charge.slices.map((s) => ({
    index: s.index,
    label: s.label,
    amountCents: s.amountCents,
    status: s.status,
    brcode: buildBrCode({
      pixKey: charge.pixKey,
      amountCents: s.amountCents,
      merchantName: charge.organizer.name || "RACHA",
      reference: `${slug}${s.index}`,
    }),
  }));

  const paidCount = charge.slices.filter((s) => s.status === "paid").length;

  return (
    <main className="rise flex flex-col gap-5">
      <Navbar
        right={
          charge.chainSig && (
            <ChainBadge href={explorerTxUrl(charge.chainSig)} label="na Solana" />
          )
        }
      />

      <div className="rounded-2xl border border-line/60 bg-sunk/40 p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
          Você foi chamado pra rachar
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight mt-1">{charge.title}</h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Organizado por <strong className="text-ink">{charge.organizer.name || "um amigo"}</strong>
        </p>
      </div>

      {isOrganizer && (
        <Link
          href={`/r/${slug}/painel`}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface px-4 py-2.5 text-center text-xs font-bold text-ink-soft transition hover:text-ink active:scale-98"
        >
          <span>👑</span>
          <span>Você é o organizador — Abrir seu painel</span>
        </Link>
      )}

      <PayFlow
        slug={slug}
        title={charge.title}
        splitMode={charge.splitMode}
        slices={slices}
        paidCount={paidCount}
        peopleCount={charge.peopleCount}
      />
    </main>
  );
}
