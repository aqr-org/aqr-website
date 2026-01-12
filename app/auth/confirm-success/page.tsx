"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to protected area after 5 seconds
    const timer = setTimeout(() => {
      router.push("/protected");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6 pb-[200px]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle className="text-2xl">
                  Email Confirmed Successfully!
                </CardTitle>
              </div>
              <CardDescription>
                Your email address has been verified and your account is now active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can now access all member features. You'll be redirected to your account in a few seconds.
              </p>
              <div className="flex justify-between gap-4 pt-4">
                <Button className="flex-1" asChild>
                  <Link href="/">Go to Homepage</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/protected">Go to Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
