import { NextResponse } from "next/server";
import { getChargeBySlug } from "@/lib/charges";
import { getOrganizerId } from "@/lib/session";
import { explorerTxUrl } from "@/lib/solana";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const charge = await getChargeBySlug(slug);
  if (!charge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const organizerId = await getOrganizerId();
  const isOrganizer = organizerId === charge.organizerId;

  const paidCents = charge.slices
    .filter((s) => s.status === "paid")
    .reduce((a, s) => a + (s.proofAmountCents ?? s.amountCents), 0);

  return NextResponse.json({
    slug: charge.slug,
    title: charge.title,
    splitMode: charge.splitMode,
    totalCents: charge.totalCents,
    peopleCount: charge.peopleCount,
    status: charge.status,
    pixKey: charge.pixKey,
    createdAt: charge.createdAt,
    chainSig: charge.chainSig,
    chainUrl: charge.chainSig ? explorerTxUrl(charge.chainSig) : null,
    paidCents,
    isOrganizer,
    slices: charge.slices.map((s) => ({
      index: s.index,
      label: s.label,
      amountCents: s.amountCents,
      status: s.status,
      payerName: s.payerName,
      paidAt: s.paidAt,
      confirmedBy: s.confirmedBy,
      chainUrl: s.chainSig ? explorerTxUrl(s.chainSig) : null,
      proofUrl: isOrganizer && s.proofRaw ? s.proofRaw : null,
    })),
  });
}
