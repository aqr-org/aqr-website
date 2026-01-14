import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { beaconDataOf } from "@/lib/utils";
import { UserBeaconData } from "@/lib/types";
import { CheckCircle2, Home, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  
  // If user is logged in, show the logged-in message
  if (!error && data?.claims?.email) {
    const userEmail = data.claims.email;
    let userName = "member";
    
    try {
      const userBeaconData = (await beaconDataOf(userEmail)) as UserBeaconData;
      userName = userBeaconData?.firstname || userName;
    } catch (err) {
      // If beacon data fetch fails, just use "member" as fallback
      console.error("Error fetching user beacon data:", err);
    }

    return (
      <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="pb-8">
             <div className="flex items-baseline gap-2">
                <CheckCircle2 className="h-auto w-8 md:w-6 text-green-600 self-baseline relative top-0.5" />
                <CardTitle className="text-2xl">
                  Hello, {userName || "member"}!
                </CardTitle>
              </div>
              <CardDescription>
                You are now logged in and have access to all members-only content on the website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  Edit your profile using the button below or by clicking the top right icon&nbsp;
                    <span className="text-qreen border border-qreen rounded-full p-0.5 inline-flex items-center justify-center">
                      <UserRound className="w-3 h-3 inline-block" />
                    </span>
                    &nbsp;in the navigation bar.
                </p>
                <div className="flex gap-2 *:basis-1/2 mt-4 pt-8 border-t border-qlack/10">
                  <Link href="/">
                    <Button className="w-full">
                      <Home className="w-4 h-4" />
                      Go to Homepage
                    </Button>
                  </Link>
                  <Link href="/protected">
                    <Button className="w-full text-qreen border-qreen hover:bg-qreen hover:border-qreen">
                      <UserRound className="w-4 h-4" />
                      Edit profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is not logged in, show the login form
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
