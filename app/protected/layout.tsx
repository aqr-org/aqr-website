import { ThemeSwitcher } from "@/components/theme-switcher";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
// import { Metadata } from "next";
// import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 w-full max-w-5xl p-5">
          <Suspense fallback={
            <div className="w-full min-h-[400px] flex items-center justify-center">
              <LoadingAnimation text="Loading account data..." />
            </div>
          }>
            {children}
          </Suspense>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
