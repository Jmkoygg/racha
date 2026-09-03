import { NextResponse } from "next/server";
import { z } from "zod";
import { submitProof, setPayerName } from "@/lib/charges";
import { explorerTxUrl } from "@/lib/solana";

const schema = z.object({
  sliceIndex: z.number().int().positive(),
  image: z.string().min(20), // data URL
  payerName: z.string().max(40).optional(),
  isSimulation: z.boolean().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { sliceIndex, image, payerName, isSimulation } = parsed.data;

  const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) {
    return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
  }
  const mimeType = m[1];
  const base64 = m[2];

  if (payerName && payerName.trim()) {
    await setPayerName(slug, sliceIndex, payerName.trim());
  }

  const outcome = await submitProof(slug, sliceIndex, base64, mimeType, isSimulation);
  const chainUrl = outcome.chainSig ? explorerTxUrl(outcome.chainSig) : null;
  return NextResponse.json({ ...outcome, chainUrl }, { status: outcome.ok ? 200 : 422 });
}
