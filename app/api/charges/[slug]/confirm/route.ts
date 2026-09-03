import { NextResponse } from "next/server";
import { z } from "zod";
import { manualConfirm, settleCharge } from "@/lib/charges";
import { getOrganizerId } from "@/lib/session";

const schema = z.object({
  action: z.enum(["confirm", "settle"]),
  sliceIndex: z.number().int().positive().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const organizerId = await getOrganizerId();
  if (!organizerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (parsed.data.action === "settle") {
    const c = await settleCharge(slug, organizerId);
    return NextResponse.json({ ok: !!c });
  }

  if (!parsed.data.sliceIndex)
    return NextResponse.json({ error: "sliceIndex required" }, { status: 400 });
  const s = await manualConfirm(slug, parsed.data.sliceIndex, organizerId);
  return NextResponse.json({ ok: !!s });
}
