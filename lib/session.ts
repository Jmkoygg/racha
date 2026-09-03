import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./db";

const COOKIE = "racha_oid";
const MAX_AGE = 60 * 60 * 24 * 365;
const SECRET = process.env.SESSION_SECRET || "racha_dev_secret_salt_2026";

function sign(value: string): string {
  const hmac = createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${hmac}`;
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) {
    // Aceita IDs antigos sem ponto se tiverem formato cuid padrão, para não quebrar sessões existentes
    return token.startsWith("c") && token.length >= 20 ? token : null;
  }
  const value = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expectedHmac = createHmac("sha256", SECRET).update(value).digest("base64url");

  if (
    signature.length === expectedHmac.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))
  ) {
    return value;
  }
  return null;
}

export async function getOrganizer() {
  const id = await getOrganizerId();
  if (!id) return null;
  return prisma.organizer.findUnique({ where: { id } });
}

export async function getOrganizerId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return verify(raw);
}

/** Cria ou atualiza o organizador ligado a este navegador. */
export async function upsertOrganizer(name: string, pixKey: string) {
  const jar = await cookies();
  const existingId = await getOrganizerId();

  let organizer;
  if (existingId && (await prisma.organizer.findUnique({ where: { id: existingId } }))) {
    organizer = await prisma.organizer.update({
      where: { id: existingId },
      data: { name: name || null, pixKey },
    });
  } else {
    organizer = await prisma.organizer.create({
      data: { name: name || null, pixKey },
    });
  }

  jar.set(COOKIE, sign(organizer.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
  return organizer;
}
