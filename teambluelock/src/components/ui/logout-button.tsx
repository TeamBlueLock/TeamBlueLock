"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <Button
      variant="outline"
      className="w-full mt-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100 text-black"
      onClick={handleLogout}
    >
      Sign Out
    </Button>
  );
}
