import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

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
      </div>
    </main>
  );
}
