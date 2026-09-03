import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertOrganizer, getOrganizer } from "@/lib/session";
import { normalizePixKey } from "@/lib/pix";

const schema = z.object({
  name: z.string().max(60).optional().default(""),
  pixKey: z.string().min(3).max(80),
});

export async function GET() {
  const o = await getOrganizer();
  return NextResponse.json({ organizer: o });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const organizer = await upsertOrganizer(
    parsed.data.name.trim(),
    normalizePixKey(parsed.data.pixKey),
  );
  return NextResponse.json({ organizer });
}
