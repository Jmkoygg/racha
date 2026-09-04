import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getChargeBySlug } from "@/lib/charges";
import { getOrganizerId } from "@/lib/session";
import { explorerTxUrl } from "@/lib/solana";
import { Navbar } from "@/components/ui";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function PainelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { slug } = await params;
  const { novo } = await searchParams;
  const charge = await getChargeBySlug(slug);
  if (!charge) notFound();

  const organizerId = await getOrganizerId();
  if (organizerId !== charge.organizerId) redirect(`/r/${slug}`);

  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const shareUrl = `${base}/r/${slug}`;

  const paidCents = charge.slices
    .filter((s) => s.status === "paid")
    .reduce((a, s) => a + (s.proofAmountCents ?? s.amountCents), 0);

  const initial = {
    slug: charge.slug,
    title: charge.title,
    splitMode: charge.splitMode,
    totalCents: charge.totalCents,
    peopleCount: charge.peopleCount,
    status: charge.status,
    paidCents,
    chainUrl: charge.chainSig ? explorerTxUrl(charge.chainSig) : null,
    slices: charge.slices.map((s) => ({
      index: s.index,
      label: s.label,
      amountCents: s.amountCents,
      status: s.status,
      payerName: s.payerName,
      paidAt: s.paidAt ? s.paidAt.toISOString() : null,
      confirmedBy: s.confirmedBy,
      chainUrl: s.chainSig ? explorerTxUrl(s.chainSig) : null,
      proofUrl: s.proofRaw ?? null,
    })),
  };

  return (
    <main className="rise flex flex-col gap-5">
      <Navbar
        right={
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-sunk text-ink-soft transition hover:text-ink"
          >
            ← Meus rachas
          </Link>
        }
      />
      <Dashboard initial={initial} shareUrl={shareUrl} justCreated={novo === "1"} />
    </main>
  );
}
