import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";
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

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const testHash = scryptSync(pin, salt, 32).toString("hex");
    return timingSafeEqual(Buffer.from(testHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
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
export async function upsertOrganizer(name: string, pixKey: string, pin?: string) {
  const jar = await cookies();
  const existingId = await getOrganizerId();
  const pinHash = pin && pin.trim().length >= 4 ? hashPin(pin.trim()) : undefined;

  let organizer;
  if (existingId && (await prisma.organizer.findUnique({ where: { id: existingId } }))) {
    organizer = await prisma.organizer.update({
      where: { id: existingId },
      data: {
        name: name || null,
        pixKey,
        ...(pinHash ? { pinHash } : {}),
      },
    });
  } else {
    organizer = await prisma.organizer.create({
      data: {
        name: name || null,
        pixKey,
        pinHash,
      },
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

/** Login seguro de outro aparelho usando nome ou chave PIX + PIN de 4 a 6 dígitos */
export async function loginWithPin(identifier: string, pin: string) {
  const trimmedIdent = identifier.trim();
  const trimmedPin = pin.trim();

  const organizers = await prisma.organizer.findMany({
    where: {
      OR: [
        { name: { equals: trimmedIdent, mode: "insensitive" } },
        { pixKey: { equals: trimmedIdent } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const matched = organizers.find((org) => org.pinHash && verifyPin(trimmedPin, org.pinHash));
  if (!matched) return null;

  const jar = await cookies();
  jar.set(COOKIE, sign(matched.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });

  return matched;
}
