import { customAlphabet } from "nanoid";
import { prisma } from "./db";
import { writeRecord } from "./solana";

const slugId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);

export interface SliceInput {
  label?: string | null;
  amountCents: number;
}

export interface CreateChargeInput {
  organizerId: string;
  title: string;
  pixKey: string;
  splitMode: "equal" | "custom";
  totalCents: number;
  peopleCount: number;
  slices: SliceInput[];
}

export async function createCharge(input: CreateChargeInput) {
  const slug = slugId();

  const charge = await prisma.charge.create({
    data: {
      slug,
      title: input.title,
      organizerId: input.organizerId,
      pixKey: input.pixKey,
      splitMode: input.splitMode,
      totalCents: input.totalCents,
      peopleCount: input.peopleCount,
      slices: {
        create: input.slices.map((s, i) => ({
          index: i + 1,
          label: s.label ?? null,
          amountCents: s.amountCents,
        })),
      },
    },
    include: { slices: true },
  });

  const sig = await writeRecord("charge_created", {
    slug,
    title: charge.title,
    total_cents: charge.totalCents,
    people: charge.peopleCount,
    split: charge.splitMode,
    at: charge.createdAt.toISOString(),
  });
  if (sig) {
    await prisma.charge.update({ where: { id: charge.id }, data: { chainSig: sig } });
    charge.chainSig = sig;
  }

  return charge;
}

export async function getChargeBySlug(slug: string) {
  return prisma.charge.findUnique({
    where: { slug },
    include: {
      slices: { orderBy: { index: "asc" } },
      organizer: true,
    },
  });
}

export interface ProofOutcome {
  ok: boolean;
  status: string;
  message: string;
  sliceIndex?: number;
  chainSig?: string | null;
  payerName?: string | null;
}

export async function submitProof(
  slug: string,
  sliceIndex: number,
  imageBase64: string,
  mimeType: string,
  _isSimulation?: boolean,
): Promise<ProofOutcome> {
  const charge = await getChargeBySlug(slug);
  if (!charge) return { ok: false, status: "not_found", message: "Cobrança não encontrada." };

  const slice = charge.slices.find((s) => s.index === sliceIndex);
  if (!slice) return { ok: false, status: "not_found", message: "Parte não encontrada." };
  if (slice.status === "paid")
    return { ok: false, status: "already_paid", message: "Essa parte já foi paga." };

  // Gera identificador único de auditoria para o comprovante
  const txId = `PIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Grava o registro imutável do pagamento na Solana devnet
  const sig = await writeRecord("payment_confirmed", {
    slug,
    slice: sliceIndex,
    amount_cents: slice.amountCents,
    payer: slice.payerName ?? null,
    pix_tx: txId,
    at: new Date().toISOString(),
  });

  // Salva o comprovante e atualiza o status para pago imediatamente
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

  const updated = await prisma.slice.update({
    where: { id: slice.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      payerName: slice.payerName,
      pixTxId: txId,
      proofAmountCents: slice.amountCents,
      proofRaw: dataUrl,
      chainSig: sig,
      confirmedBy: "proof",
    },
  });

  await maybeSettle(charge.id);

  return {
    ok: true,
    status: "ok",
    message: "Pagamento confirmado!",
    sliceIndex,
    chainSig: updated.chainSig,
    payerName: updated.payerName,
  };
}

export async function manualConfirm(slug: string, sliceIndex: number, organizerId: string) {
  const charge = await getChargeBySlug(slug);
  if (!charge || charge.organizerId !== organizerId) return null;
  const slice = charge.slices.find((s) => s.index === sliceIndex);
  if (!slice || slice.status === "paid") return null;

  const sig = await writeRecord("payment_confirmed", {
    slug,
    slice: sliceIndex,
    amount_cents: slice.amountCents,
    payer: slice.payerName ?? null,
    manual: true,
    at: new Date().toISOString(),
  });

  const updated = await prisma.slice.update({
    where: { id: slice.id },
    data: { status: "paid", paidAt: new Date(), chainSig: sig, confirmedBy: "manual" },
  });
  await maybeSettle(charge.id);
  return updated;
}

export async function setPayerName(slug: string, sliceIndex: number, name: string) {
  const charge = await getChargeBySlug(slug);
  if (!charge) return;
  const slice = charge.slices.find((s) => s.index === sliceIndex);
  if (!slice) return;
  await prisma.slice.update({ where: { id: slice.id }, data: { payerName: name.slice(0, 40) } });
}

export async function settleCharge(slug: string, organizerId: string) {
  const charge = await prisma.charge.findUnique({
    where: { slug },
    include: { slices: true },
  });
  if (!charge || charge.organizerId !== organizerId) return null;

  const allPaid = charge.slices.every((s) => s.status === "paid");
  if (!allPaid) {
    throw new Error("Não é possível encerrar a cobrança antes que todos os amigos paguem.");
  }

  return prisma.charge.update({ where: { id: charge.id }, data: { status: "settled" } });
}

export async function deleteCharge(slug: string, organizerId: string) {
  const charge = await prisma.charge.findUnique({
    where: { slug },
    include: { slices: true },
  });
  if (!charge || charge.organizerId !== organizerId) return false;

  const hasPaid = charge.slices.some((s) => s.status === "paid");
  if (hasPaid) {
    throw new Error("Não é possível excluir um racha que já possui pagamentos recebidos.");
  }

  await prisma.slice.deleteMany({ where: { chargeId: charge.id } });
  await prisma.charge.delete({ where: { id: charge.id } });
  return true;
}

async function maybeSettle(chargeId: string) {
  const slices = await prisma.slice.findMany({ where: { chargeId } });
  if (slices.length > 0 && slices.every((s) => s.status === "paid")) {
    await prisma.charge.update({ where: { id: chargeId }, data: { status: "settled" } });
  }
}
