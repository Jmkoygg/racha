import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPin } from "@/lib/session";

const schema = z.object({
  identifier: z.string().min(2).max(100),
  pin: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { identifier, pin } = parsed.data;
  const organizer = await loginWithPin(identifier, pin);

  if (!organizer) {
    return NextResponse.json(
      { error: "Identificador ou PIN incorretos. Verifique e tente novamente." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, organizer });
}
