import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertOrganizer, getOrganizer, OrganizerError } from "@/lib/session";
import { normalizePixKey } from "@/lib/pix";

const schema = z.object({
  name: z.string().max(60).optional().default(""),
  pixKey: z.string().min(3).max(80),
  pin: z.string().min(4).max(8).optional(),
});

export async function GET() {
  const o = await getOrganizer();
  return NextResponse.json({ organizer: o });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Dados inválidos.";
      return NextResponse.json({ error: issue }, { status: 400 });
    }
    const organizer = await upsertOrganizer(
      parsed.data.name.trim(),
      normalizePixKey(parsed.data.pixKey),
      parsed.data.pin,
    );
    return NextResponse.json({ organizer });
  } catch (err: unknown) {
    if (err instanceof OrganizerError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erro ao salvar organizador:", err);
    return NextResponse.json(
      { error: `Erro ao salvar organizador: ${msg}` },
      { status: 500 },
    );
  }
}
