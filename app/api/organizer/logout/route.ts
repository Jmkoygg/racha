import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete("racha_oid");
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const jar = await cookies();
  jar.delete("racha_oid");
  return NextResponse.redirect(new URL("/", req.url));
}
