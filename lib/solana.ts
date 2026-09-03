import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import bs58 from "bs58";

const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

let cachedKeypair: Keypair | null = null;

function appKeypair(): Keypair | null {
  if (cachedKeypair) return cachedKeypair;
  const b58 = process.env.APP_WALLET_SECRET_B58;
  if (b58) {
    try {
      cachedKeypair = Keypair.fromSecretKey(bs58.decode(b58.trim()));
      return cachedKeypair;
    } catch (err) {
      console.error("[solana] Falha ao decodificar APP_WALLET_SECRET_B58:", err);
    }
  }
  const secret = process.env.APP_WALLET_SECRET_JSON;
  if (!secret) return null;
  try {
    const bytes = Uint8Array.from(JSON.parse(secret) as number[]);
    cachedKeypair = Keypair.fromSecretKey(bytes);
    return cachedKeypair;
  } catch {
    return null;
  }
}

export function solanaConfigured(): boolean {
  return appKeypair() !== null;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${CLUSTER}`;
}

export function appWalletAddress(): string | null {
  return appKeypair()?.publicKey.toBase58() ?? null;
}

/**
 * Escreve um registro imutável na Solana como memo transaction.
 * Retorna a assinatura (usada pra montar o link do explorer) ou null se
 * a carteira do app não estiver configurada / sem saldo.
 *
 * TODO(upgrade): trocar por um programa Anchor com PDA por cobrança e por
 * pagamento, pra o histórico ser consultável on-chain sem indexador.
 */
export async function writeRecord(
  kind: "charge_created" | "payment_confirmed",
  data: Record<string, unknown>,
): Promise<string | null> {
  const kp = appKeypair();
  if (!kp) return null;

  const payload = JSON.stringify({ app: "racha", v: 1, kind, ...data });
  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const tx = new Transaction().add(
      createMemoInstruction(payload, [kp.publicKey]),
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], {
      commitment: "confirmed",
      maxRetries: 3,
    });
    return sig;
  } catch (err) {
    console.error("[solana] writeRecord failed:", (err as Error).message);
    return null;
  }
}
