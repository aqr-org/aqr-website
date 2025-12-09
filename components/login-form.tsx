"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ERROR_CODES,
  logAuthError,
  safeJsonParse,
  safeFetch,
} from "@/lib/error-utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read confirmed parameter once on mount and store in state that won't reset
  const [isConfirmed] = useState(() => searchParams.get("confirmed") === "true");
  const hasCleanedUrl = useRef(false);

  // Clean up URL by removing the query parameter after component mounts
  useEffect(() => {
    if (isConfirmed && !hasCleanedUrl.current && typeof window !== "undefined") {
      hasCleanedUrl.current = true;
      // Use requestAnimationFrame to ensure component has rendered before URL change
      requestAnimationFrame(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("confirmed");
        window.history.replaceState({}, "", url.toString());
      });
    }
  }, [isConfirmed]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      
      // First check if this is the superadmin (skip Beacon check if so)
      const { response: superadminCheckResponse, error: superadminFetchError } = await safeFetch(
        '/api/check-superadmin',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        },
        ERROR_CODES.SUPERADMIN_CHECK_FAILED,
        'superadmin_check',
        normalizedEmail
      );

      let superadminCheck = { skipBeaconCheck: false };

      if (superadminFetchError) {
        logAuthError({
          errorCode: ERROR_CODES.SUPERADMIN_CHECK_FAILED,
          step: 'superadmin_check_fetch',
          error: new Error(superadminFetchError),
          email: normalizedEmail,
        });
        // Continue with default (not superadmin) if fetch fails
      } else if (superadminCheckResponse) {
        if (superadminCheckResponse.ok) {
          const { data: parsedCheck, error: jsonError } = await safeJsonParse<{
            skipBeaconCheck: boolean;
          }>(
            superadminCheckResponse,
            ERROR_CODES.SUPERADMIN_JSON_PARSE,
            'superadmin_check',
            normalizedEmail
          );

          if (jsonError) {
            logAuthError({
              errorCode: ERROR_CODES.SUPERADMIN_JSON_PARSE,
              step: 'superadmin_check_json',
              error: new Error(jsonError),
              email: normalizedEmail,
            });
            // Continue with default (not superadmin) if JSON parse fails
          } else if (parsedCheck) {
            superadminCheck = parsedCheck;
          }
        } else {
          logAuthError({
            errorCode: ERROR_CODES.SUPERADMIN_CHECK_FAILED,
            step: 'superadmin_check_response',
            error: new Error(`HTTP ${superadminCheckResponse.status}: ${superadminCheckResponse.statusText}`),
            email: normalizedEmail,
            additionalData: {
              httpStatus: superadminCheckResponse.status,
              httpStatusText: superadminCheckResponse.statusText,
            },
          });
          // Continue with default (not superadmin) if response not ok
        }
      }
      
      // Skip Beacon membership check for superadmin
      if (!superadminCheck.skipBeaconCheck) {
        // Call the API route to verify Beacon membership for regular users
        const { response: checkResponse, error: fetchError } = await safeFetch(
          '/auth/beacon/check-membership',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail }),
          },
          ERROR_CODES.BEACON_API_FAILED,
          'beacon_membership_check',
          normalizedEmail
        );

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        if (!checkResponse) {
          setError('Unable to verify membership status. Please try again later.');
          setIsLoading(false);
          return;
        }

        if (!checkResponse.ok) {
          const statusCode = checkResponse.status;
          const errorCode = statusCode === 500 
            ? ERROR_CODES.BEACON_API_500 
            : statusCode === 400 
            ? ERROR_CODES.BEACON_API_400 
            : ERROR_CODES.BEACON_API_FAILED;

          logAuthError({
            errorCode,
            step: 'beacon_membership_check_response',
            error: new Error(`HTTP ${statusCode}: ${checkResponse.statusText}`),
            email: normalizedEmail,
            additionalData: {
              httpStatus: statusCode,
              httpStatusText: checkResponse.statusText,
            },
          });

          setError('Unable to verify membership status. Please try again later.');
          setIsLoading(false);
          return;
        }

        const { data: check, error: jsonError } = await safeJsonParse<{
          ok: boolean;
          reason?: string;
        }>(
          checkResponse,
          ERROR_CODES.BEACON_JSON_PARSE,
          'beacon_membership_check',
          normalizedEmail
        );

        if (jsonError) {
          setError(jsonError);
          setIsLoading(false);
          return;
        }

        if (!check) {
          setError('Unable to verify membership status. Please try again later.');
          setIsLoading(false);
          return;
        }

        if (!check.ok) {
          let errorCode: string = ERROR_CODES.BEACON_NOT_FOUND;
          let errorMessage = 'Unable to verify membership status. Please try again later.';

          if (check.reason === 'beacon-not-found') {
            errorCode = ERROR_CODES.BEACON_NOT_FOUND;
            errorMessage = 'No AQR membership found for this email address. Please contact support.';
          } else if (check.reason === 'no-active-membership') {
            errorCode = ERROR_CODES.BEACON_NO_ACTIVE_MEMBERSHIP;
            errorMessage = 'No active AQR membership found for this email address. Please contact support.';
          }

          logAuthError({
            errorCode,
            step: 'beacon_membership_validation',
            error: new Error(`Beacon check failed: ${check.reason || 'unknown'}`),
            email: normalizedEmail,
            additionalData: {
              reason: check.reason,
            },
          });

          setError(errorMessage);
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      
      if (error) {
        logAuthError({
          errorCode: ERROR_CODES.SUPABASE_SIGNIN_FAILED,
          step: 'supabase_signin',
          error,
          email: normalizedEmail,
          additionalData: {
            supabaseErrorCode: error.status || error.code,
            supabaseErrorMessage: error.message,
          },
        });
        throw error;
      }
      
      // Redirect superadmin to superadmin panel, regular users to protected page
      const redirectPath = superadminCheck.skipBeaconCheck ? "/superadmin" : "/protected";
      try {
        router.push(redirectPath);
      } catch (navError) {
        logAuthError({
          errorCode: ERROR_CODES.ROUTER_NAVIGATION,
          step: 'login_redirect',
          error: navError,
          email: normalizedEmail,
          additionalData: {
            redirectPath,
          },
        });
        // Still show success - navigation failure doesn't mean login failed
        setError('Login successful, but we encountered an issue redirecting you. Please navigate manually.');
      }
    } 
    catch (error: unknown) {
      const baseMessage = error instanceof Error ? error.message : "An error occurred";
      let errorCode: string;
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
      let additionalInfo = supportEmail 
        ? `.\n\nPlease contact support at ${supportEmail} if you continue to have issues.`
        : `.\n\nPlease contact support if you continue to have issues.`;

      // IF INVALID EMAIL OR PASSWORD
      if (baseMessage.toLowerCase().includes("invalid login credentials")) {
        errorCode = ERROR_CODES.SUPABASE_SIGNIN_FAILED;
        additionalInfo = `.\n\nHave you created an account already? If not, click the "Sign up" link below the Login button.`;
      }
      // IF EMAIL NOT CONFIRMED
      else if (baseMessage.toLowerCase().includes("email not confirmed")) {
        errorCode = ERROR_CODES.SUPABASE_EMAIL_NOT_CONFIRMED;
        additionalInfo = `.\n\nPlease click on the link in the newest confirmation email you received.\n\n• If you received multiple confirmation emails, only the newest one is valid.\n• If you did not receive a confirmation email, check your SPAM folder or try to sign up again.\n• If you continue to have issues, please contact support.`;
      }
      else {
        errorCode = ERROR_CODES.SUPABASE_SIGNIN_FAILED;
      }

      // Log error if not already logged (some errors are logged before being thrown)
      if (!(error instanceof Error && error.message === baseMessage && baseMessage.toLowerCase().includes("invalid login credentials"))) {
        logAuthError({
          errorCode,
          step: 'login_catch_all',
          error,
          email: normalizedEmail,
        });
      }

      // Don't show error codes - all errors are logged but not shown to users
      setError(baseMessage + additionalInfo);
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("form flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isConfirmed ? "Your email is confirmed!" : "Login"}
          </CardTitle>
          <CardDescription>
            {isConfirmed ? (
              "You can now log in with your email and password"
            ) : (
              <div className="text-sm space-y-1 mt-2 pt-4 border-t border-qlack border-dashed">
                <p>First time here? <Link href="/auth/sign-up" className="underline underline-offset-4 font-semibold">Sign up</Link> for an account.</p>
                <p>Not a member yet? <Link href="/members/new-membership-application" className="underline underline-offset-4 font-semibold">Join AQR</Link></p>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-xs underline-offset-4 hover:underline pb-2"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-qaupe font-medium bg-red-500 border border-red-500 p-4 pr-6 rounded-lg flex items-start gap-4">
                  <TriangleAlert className="w-6 basis-6 shrink-0 grow-0" />
                  <span className="whitespace-pre-line">{error}</span>
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
