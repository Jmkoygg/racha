import { NextResponse } from "next/server";
import { getChargeBySlug, deleteCharge } from "@/lib/charges";
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

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const organizerId = await getOrganizerId();
  if (!organizerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const ok = await deleteCharge(slug, organizerId);
    if (!ok) return NextResponse.json({ error: "forbidden_or_not_found" }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Não foi possível excluir a cobrança.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
