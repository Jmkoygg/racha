/**
 * Gera o "Pix Copia e Cola" (BR Code / EMV MPM) no cliente ou no server.
 * Chave + valor fixo, estático. Sem PSP, sem URL dinâmica.
 *
 * Referência: Manual do BR Code (BCB) — EMV MPM.
 */

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function sanitizeText(s: string, max: number): string {
  return stripAccents(s)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .slice(0, max);
}

/** Normaliza a chave PIX pelos formatos aceitos pelo DICT. */
export function normalizePixKey(raw: string): string {
  const k = raw.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(k)) return k.toLowerCase(); // email
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
    return k.toLowerCase(); // chave aleatória (EVP)
  const digits = k.replace(/\D/g, "");
  if (k.startsWith("+")) return "+" + digits; // já veio E.164
  if (digits.length === 11 && !k.includes("+")) {
    // pode ser CPF ou celular. Celular DDD+9+8 começa com [1-9][1-9]9...
    // CPF é 11 dígitos quaisquer. Heurística: se o 3º dígito é 9, tratamos como celular.
    if (digits[2] === "9") return "+55" + digits;
    return digits; // CPF
  }
  if (digits.length === 10) return "+55" + digits; // fixo/celular antigo
  if (digits.length === 14) return digits; // CNPJ
  return k;
}

export function keyKind(key: string): "email" | "evp" | "phone" | "cpf" | "cnpj" | "unknown" {
  if (/@/.test(key)) return "email";
  if (/^[0-9a-f-]{36}$/i.test(key)) return "evp";
  if (key.startsWith("+")) return "phone";
  const d = key.replace(/\D/g, "");
  if (d.length === 11) return "cpf";
  if (d.length === 14) return "cnpj";
  return "unknown";
}

export interface BrCodeInput {
  pixKey: string;
  amountCents: number;
  merchantName?: string;
  merchantCity?: string;
  reference?: string;
}

export function buildBrCode({
  pixKey,
  amountCents,
  merchantName = "RACHA",
  merchantCity = "BRASIL",
  reference = "***",
}: BrCodeInput): string {
  const key = normalizePixKey(pixKey);
  const amount = (amountCents / 100).toFixed(2);

  const gui = tlv("00", "br.gov.bcb.pix");
  const merchantAccount = tlv("26", gui + tlv("01", key));

  const ref = sanitizeText(reference, 25) || "***";
  const additionalData = tlv("62", tlv("05", ref));

  const payloadNoCrc =
    tlv("00", "01") +
    tlv("01", "11") +
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount) +
    tlv("58", "BR") +
    tlv("59", sanitizeText(merchantName, 25) || "RACHA") +
    tlv("60", sanitizeText(merchantCity, 15) || "BRASIL") +
    additionalData +
    "6304";

  return payloadNoCrc + crc16(payloadNoCrc);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
