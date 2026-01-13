import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmSuccessPage() {

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6 pb-[200px]">
          <Card>
            <CardHeader>
              <div className="flex items-baseline gap-2 mb-2">
                <CheckCircle2 className="h-auto w-8 md:w-6 text-green-600 self-baseline relative top-0.5" />
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
                You can now access all member features by logging in to your account with your email and password.
              </p>
              <div className="flex justify-between gap-4 pt-4">
                <Button className="flex-1" asChild>
                  <Link href="/protected">Log in to your account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
