import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;

  // If no token provided, redirect to sign-up page
  // Simple check - token just needs to exist (no database verification)
  if (!token) {
    redirect("/auth/sign-up?error=invalid_token");
  }

  // Token exists - show success page
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6 pb-[200px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>You&apos;ve successfully signed up. Please check your email to confirm your account before signing in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs">
                <strong className="font-semibold">No confirmation email within 20 minutes?</strong>
                <br /> 
                Please make sure to check your Spam folder and other inboxes. 
              </p>
              <p className="text-xs">
                <strong className="font-semibold">Still no confirmation email?</strong> 
                <br />
                Try signing up again and in case of further issues, contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
