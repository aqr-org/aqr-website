"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
      <Link href="/protected" className="text-sm">
        Hey, {user.email}!
      </Link>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-8 justify-between w-full">
      <Link href="/auth/login" className="font-medium flex gap-2 items-center">
        <span>
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.2201 6.6105V3.9705C13.2201 2.3205 11.8701 0.970497 10.2201 0.970497H5.85008C4.20008 0.970497 2.85008 2.3205 2.85008 3.9705V6.6105H0.0800781V15.8905C0.0800781 18.1005 1.87008 19.8905 4.08008 19.8905H12.0001C14.2101 19.8905 16.0001 18.1005 16.0001 15.8905V6.6105H13.2201ZM4.86008 3.9705C4.86008 3.4205 5.31008 2.9705 5.86008 2.9705H10.2301C10.7801 2.9705 11.2301 3.4205 11.2301 3.9705V6.6105H4.86008V3.9705ZM14.0001 15.8905C14.0001 16.9905 13.1001 17.8905 12.0001 17.8905H4.08008C2.98008 17.8905 2.08008 16.9905 2.08008 15.8905V8.6105H14.0001V15.8905Z" fill="currentColor"/>
          <path d="M9.42008 15.9605L8.69008 12.7705C9.12008 12.5405 9.42008 12.0905 9.42008 11.5605C9.42008 10.8005 8.80008 10.1805 8.04008 10.1805C7.28008 10.1805 6.66008 10.8005 6.66008 11.5605C6.66008 12.0805 6.96008 12.5305 7.39008 12.7705L6.66008 15.9605H9.42008Z" fill="currentColor"/>
        </svg>

        </span>
        Log in
      </Link>
      {/* <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button> */}
      <Button variant={"qreen"}>
        <Link href='/members/new-membership-application' className="flex items-center gap-1">
          <span>
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 17.4305C1 13.6007 4.13233 10.4991 8 10.4991C11.8677 10.4991 15 13.6007 15 17.4305M12.5839 5.9695C12.5839 8.47633 10.5316 10.5085 8 10.5085C5.46838 10.5085 3.4161 8.47633 3.4161 5.9695C3.4161 3.46268 5.46838 1.4305 8 1.4305C10.5316 1.4305 12.5839 3.46268 12.5839 5.9695Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
          </svg>
          </span>
          Join AQR
        </Link>
      </Button>
    </div>
  );
}
