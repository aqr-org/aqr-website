"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}

export function LogoutMenuItem() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      logout();
    }
  };

  return (
    <button
      type="button"
      className="flex items-center cursor-pointer w-full text-left hover:text-qreen/80 focus:outline-none focus:ring-2 focus:ring-qreen focus:rounded px-1"
      onClick={logout}
      onKeyDown={handleKeyDown}
      role="menuitem"
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Logout</span>
    </button>
  );
}
