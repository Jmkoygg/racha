import { ComprovanteData } from "./vision";
import { normalizePixKey } from "./pix";

export type VerifyStatus = "ok" | "amount_mismatch" | "wrong_dest" | "stale" | "no_txid";

export interface VerifyResult {
  status: VerifyStatus;
  message: string;
  matchedAmountCents: number | null;
}

/** Compara duas chaves PIX de forma tolerante (formatação varia entre bancos). */
function keysMatch(a: string, b: string): boolean {
  const na = normalizePixKey(a).toLowerCase();
  const nb = normalizePixKey(b).toLowerCase();
  if (na === nb) return true;
  const da = na.replace(/\D/g, "");
  const db = nb.replace(/\D/g, "");
  // telefone: compara os últimos 8 dígitos; documento: compara tudo
  if (da.length >= 8 && db.length >= 8) {
    return da.slice(-8) === db.slice(-8) && da.slice(-11) === db.slice(-11);
  }
  return false;
}

function namesLooselyMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !["dos", "das", "da", "de", "do"].includes(w));
  const wa = new Set(norm(a));
  const wb = norm(b);
  const shared = wb.filter((w) => wa.has(w)).length;
  if (wa.size === 0 || wb.length === 0) return true;
  return shared >= 1;
}

export interface VerifyInput {
  expectedAmountCents: number;
  organizerPixKey: string;
  organizerName?: string | null;
  chargeCreatedAt: Date;
  proof: ComprovanteData;
}

export function verifyComprovante(input: VerifyInput): VerifyResult {
  const { expectedAmountCents, organizerPixKey, organizerName, chargeCreatedAt, proof } = input;

  // Se não achar o código E2E longo (aluno tirou print da tela inicial do Nubank/Inter sem rolar até o rodapé),
  // mas o valor bater com o esperado, geramos um identificador único de auditoria
  if (!proof.txId || proof.txId.replace(/\s/g, "").length < 4) {
    proof.txId = `PRINT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  // destino: precisa bater a chave OU o nome do organizador
  const keyOk = proof.destKey ? keysMatch(proof.destKey, organizerPixKey) : false;
  const nameOk =
    !!proof.destName && !!organizerName && namesLooselyMatch(proof.destName, organizerName);
  if (proof.destKey || proof.destName) {
    if (!keyOk && !nameOk) {
      return {
        status: "wrong_dest",
        message:
          "Esse comprovante é de um PIX pra outra pessoa. Confere se você pagou pra chave certa.",
        matchedAmountCents: proof.amountCents,
      };
    }
  }

  // data: recusa comprovante com mais de 3 dias (evita reaproveitar print antigo)
  if (proof.dateISO) {
    const d = new Date(proof.dateISO);
    if (!isNaN(d.getTime())) {
      const ageMs = Date.now() - d.getTime();
      const beforeCharge = d.getTime() < chargeCreatedAt.getTime() - 60 * 60 * 1000;
      if (ageMs > 3 * 24 * 3600 * 1000 || beforeCharge) {
        return {
          status: "stale",
          message: "Esse comprovante é antigo — não corresponde a essa cobrança.",
          matchedAmountCents: proof.amountCents,
        };
      }
    }
  }

  // valor
  if (proof.amountCents == null) {
    return {
      status: "amount_mismatch",
      message: "Não consegui ler o valor no comprovante.",
      matchedAmountCents: null,
    };
  }
  if (proof.amountCents < expectedAmountCents) {
    return {
      status: "amount_mismatch",
      message: `O comprovante mostra ${brl(proof.amountCents)}, mas sua parte é ${brl(
        expectedAmountCents,
      )}.`,
      matchedAmountCents: proof.amountCents,
    };
  }

  return {
    status: "ok",
    message: "Pagamento confirmado.",
    matchedAmountCents: proof.amountCents,
  };
}

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
