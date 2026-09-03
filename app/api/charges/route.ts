import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizerId, getOrganizer } from "@/lib/session";
import { createCharge } from "@/lib/charges";
import { normalizePixKey } from "@/lib/pix";

const schema = z.object({
  title: z.string().min(1).max(80),
  pixKey: z.string().min(3).max(80),
  splitMode: z.enum(["equal", "custom"]),
  totalCents: z.number().int().positive().max(100_000_00),
  peopleCount: z.number().int().min(1).max(60),
  slices: z
    .array(
      z.object({
        label: z.string().max(40).nullish(),
        amountCents: z.number().int().positive().max(100_000_00),
      }),
    )
    .min(1)
    .max(60),
});

export async function POST(req: Request) {
  const organizerId = await getOrganizerId();
  const organizer = await getOrganizer();
  if (!organizerId || !organizer) {
    return NextResponse.json({ error: "Configure seu nome e chave PIX primeiro." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const d = parsed.data;

  const sum = d.slices.reduce((a, s) => a + s.amountCents, 0);
  if (Math.abs(sum - d.totalCents) > 1) {
    return NextResponse.json(
      { error: "A soma das partes não bate com o total." },
      { status: 400 },
    );
  }

  const charge = await createCharge({
    organizerId,
    title: d.title.trim(),
    pixKey: normalizePixKey(d.pixKey),
    splitMode: d.splitMode,
    totalCents: d.totalCents,
    peopleCount: d.peopleCount,
    slices: d.slices.map((s) => ({ label: s.label ?? null, amountCents: s.amountCents })),
  });

  return NextResponse.json({ slug: charge.slug });
}
