import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
