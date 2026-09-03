import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrganizer } from "@/lib/session";
import { Card, Navbar } from "@/components/ui";
import NovaForm from "@/components/NovaForm";

export const dynamic = "force-dynamic";

export default async function NovaPage() {
  const organizer = await getOrganizer();
  if (!organizer) redirect("/");

  return (
    <main className="rise flex flex-col gap-5">
      <Navbar
        right={
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-sunk text-ink-soft transition hover:text-ink"
          >
            ← Voltar
          </Link>
        }
      />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Criar novo racha</h1>
        <p className="text-xs text-ink-soft mt-1">
          Lança o valor e divide igualmente com 1 link pro grupo.
        </p>
      </div>
      <Card className="border-line/80 shadow-md">
        <NovaForm pixKey={organizer.pixKey} />
      </Card>
    </main>
  );
}
