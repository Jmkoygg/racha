"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/organizer/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      type="button"
      title="Sair deste aparelho"
      className="text-xs font-semibold px-2 py-1 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-soft transition cursor-pointer"
    >
      Sair
    </button>
  );
}
