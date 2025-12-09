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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserBeaconData } from "@/lib/types";
import {
  ERROR_CODES,
  logAuthError,
  safeJsonParse,
  safeFetch,
} from "@/lib/error-utils";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Helper function to generate token and redirect to success page
  const redirectToSuccessPage = (email: string) => {
    try {
      // Generate a secure random token client-side
      const token = crypto.randomUUID();
      router.push(`/auth/sign-up-success?token=${token}`);
    } catch (error) {
      logAuthError({
        errorCode: ERROR_CODES.ROUTER_NAVIGATION,
        step: 'redirect_to_success',
        error,
        email,
      });
      // Still show success message even if navigation fails
      setError(
        'Your account was created successfully, but we encountered an issue redirecting you. Please check your email for the confirmation link and try logging in.'
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Call the API route instead of the function directly (client components can't access server env vars)
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
        setError(
          'We could not confirm your email address is associated with an AQR membership account. Please contact support.'
        );
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

        setError(
          'We could not confirm your email address is associated with an AQR membership account. Please contact support.'
        );
        setIsLoading(false);
        return;
      }

      const { data: check, error: jsonError } = await safeJsonParse<{
        ok: boolean;
        reason?: string;
        data?: UserBeaconData;
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
        setError(
          'We could not confirm your email address is associated with an AQR membership account. Please contact support.'
        );
        setIsLoading(false);
        return;
      }

      if (!check.ok) {
        // Map reasons to messages
        let errorCode: string = ERROR_CODES.BEACON_NOT_FOUND;
        let errorMessage = "We could not confirm your email address is associated with an AQR membership account. Please contact support.";
        
        if (check.reason === 'beacon-not-found') {
          errorCode = ERROR_CODES.BEACON_NOT_FOUND;
          errorMessage = "We could not confirm your email address is associated with an AQR membership account. Please contact support.";
        } else if (check.reason === 'business-directory') {
          errorCode = ERROR_CODES.BEACON_BUSINESS_DIRECTORY;
          errorMessage = "Business Directory members cannot create an account. Please contact support.";
        } else if (check.reason === 'no-active-membership') {
          errorCode = ERROR_CODES.BEACON_NO_ACTIVE_MEMBERSHIP;
          errorMessage = "No current AQR membership found for this email address. Please contact support.";
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

      const userBeaconData = check.data as UserBeaconData;
      const personId = userBeaconData?.id ?? null;
      console.log("Matched Beacon Person ID:", personId);

      // OK — all checks passed, proceed with sign-up
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login?confirmed=true`,
        },
      });
      
      if (error) {
        // Handle specific error cases
        const errorMessage = error.message.toLowerCase();
        const errorCode = error.status || error.code;

        logAuthError({
          errorCode: ERROR_CODES.SUPABASE_SIGNUP_FAILED,
          step: 'supabase_signup',
          error,
          email: normalizedEmail,
          additionalData: {
            supabaseErrorCode: errorCode,
            supabaseErrorMessage: error.message,
          },
        });

        if (errorCode === 400 && errorMessage.includes("invalid login credentials")) {
          setError("An account already exists with this email address! Please log in instead.");
          setIsLoading(false);
          return;
        } else {
          const formattedErrorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
          setError(formattedErrorMessage);
          setIsLoading(false);
          return;
        }
      }

      // CRITICAL: Verify user was actually created
      // If signUp() returns no user, signup failed
      if (!data?.user) {
        logAuthError({
          errorCode: ERROR_CODES.SUPABASE_NO_USER,
          step: 'supabase_signup_verify',
          error: new Error('No user returned from Supabase signUp'),
          email: normalizedEmail,
          additionalData: {
            hasData: !!data,
            hasSession: !!data?.session,
          },
        });
        setError("Failed to create account. Please try again or contact support at admin@aqr.org.uk if the problem persists.");
        setIsLoading(false);
        return;
      }

      const signUpUserCreatedAt = data.user.created_at;
      
      // IMPORTANT: When email confirmations are enabled, Supabase does NOT return an error
      // for existing emails (to prevent email enumeration attacks). Instead, it returns
      // a user object but NO session. We need to check if the user already exists.
      
      // If we got a user but no session, verify if this is a new signup or existing user
      if (!data?.session) {
        // Check if this is a newly created user (created within last 10 seconds)
        const isNewUser = signUpUserCreatedAt && 
          (new Date().getTime() - new Date(signUpUserCreatedAt).getTime()) < 15000;
        
        // Try to sign in with the provided password to check if account already exists
        // This is the most reliable way to detect existing accounts when email confirmations are enabled
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        
        if (signInData?.session) {
          // Sign in succeeded - account already exists!
          // Sign out immediately since we don't want to log them in during signup
          await supabase.auth.signOut();
          logAuthError({
            errorCode: ERROR_CODES.SUPABASE_ACCOUNT_EXISTS,
            step: 'supabase_signup_existing_account',
            error: new Error('Account already exists - sign in succeeded during signup'),
            email: normalizedEmail,
          });
          setError("An account already exists with this email address, please log in instead.");
          setIsLoading(false);
          return;
        }
        
        // If sign in failed, check the error
        if (signInError) {
          const signInErrorMessage = signInError.message.toLowerCase();
          
          // If error is "Email not confirmed", it's the user we just created
          if (signInErrorMessage.includes("email not confirmed")) {
            // Only proceed if this is a newly created user
            if (isNewUser) {
              redirectToSuccessPage(normalizedEmail);
              return;
            } else {
              // User exists but is unconfirmed - they need to resend confirmation email
              logAuthError({
                errorCode: ERROR_CODES.SUPABASE_EMAIL_NOT_CONFIRMED,
                step: 'supabase_signup_unconfirmed_existing',
                error: signInError,
                email: normalizedEmail,
                additionalData: {
                  isNewUser,
                },
              });
              setError("An account with this email already exists but hasn't been confirmed. We have sent a new confirmation link to your email, the first one is now invalid.\n\nPlease check your email for the confirmation link.");
              setIsLoading(false);
              return;
            }
          }
          
          // If error is "Invalid login credentials", the account exists but password is wrong
          // Since we just set the password, this means it's an existing account
          if (signInErrorMessage.includes("invalid login credentials") || 
              signInErrorMessage.includes("invalid credentials")) {
            // Account exists but password doesn't match - means it's an existing account
            logAuthError({
              errorCode: ERROR_CODES.SUPABASE_ACCOUNT_EXISTS,
              step: 'supabase_signup_invalid_credentials',
              error: signInError,
              email: normalizedEmail,
            });
            setError("An account already exists with this email address. Please log in instead.");
            setIsLoading(false);
            return;
          }
          
          // For other sign-in errors, check if user is new
          if (isNewUser) {
            // Likely a new user, proceed to success page
            logAuthError({
              errorCode: ERROR_CODES.SUPABASE_SIGNIN_FAILED,
              step: 'supabase_signup_new_user_signin_error',
              error: signInError,
              email: normalizedEmail,
              additionalData: {
                note: 'Proceeding despite sign-in error for new user',
              },
            });
            redirectToSuccessPage(normalizedEmail);
            return;
          } else {
            // User exists but something else went wrong
            logAuthError({
              errorCode: ERROR_CODES.SUPABASE_SIGNIN_FAILED,
              step: 'supabase_signup_existing_user_signin_error',
              error: signInError,
              email: normalizedEmail,
              additionalData: {
                isNewUser,
              },
            });
            setError("An account may already exist with this email. Please try signing in, or contact support at admin@aqr.org.uk if you continue to have issues.");
            setIsLoading(false);
            return;
          }
        }
        
        // No sign-in error but no session either - this is unusual
        // Only proceed if we're confident it's a new user
        if (isNewUser) {
          logAuthError({
            errorCode: ERROR_CODES.SUPABASE_SIGNIN_FAILED,
            step: 'supabase_signup_no_session_no_error',
            error: new Error('No session and no error - unusual state'),
            email: normalizedEmail,
            additionalData: {
              note: 'Proceeding for new user despite unusual state',
            },
          });
          redirectToSuccessPage(normalizedEmail);
          return;
        } else {
          logAuthError({
            errorCode: ERROR_CODES.SUPABASE_SIGNIN_FAILED,
            step: 'supabase_signup_unusual_state',
            error: new Error('Unusual state: user exists but sign-in returned no error and no session'),
            email: normalizedEmail,
            additionalData: {
              isNewUser,
            },
          });
          setError("Unable to verify account status. Please contact support at admin@aqr.org.uk and share the steps you took leading up to this error.");
          setIsLoading(false);
          return;
        }
      }

      // If we have both user and session, it's a successful signup (email confirmations disabled)
      if (data?.user && data?.session) {
        redirectToSuccessPage(normalizedEmail);
      } else {
        // This shouldn't happen if we've handled all cases above, but just in case
        logAuthError({
          errorCode: ERROR_CODES.SUPABASE_SIGNUP_FAILED,
          step: 'supabase_signup_unexpected_result',
          error: new Error('Unexpected sign-up result'),
          email: normalizedEmail,
          additionalData: {
            hasUser: !!data?.user,
            hasSession: !!data?.session,
          },
        });
        setError("Failed to create account. Please try again.");
        setIsLoading(false);
      }


    } catch (error: unknown) {
      logAuthError({
        errorCode: ERROR_CODES.UNKNOWN_ERROR,
        step: 'signup_catch_all',
        error,
        email: normalizedEmail,
      });
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("form flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
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
                <div className="flex justify-between items-baseline gap-2">
                  <Label htmlFor="password">Password</Label>
                  <p className="text-xs">At least 6 characters, max 72 characters</p>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              { error && 
                <p className="text-sm text-qaupe font-medium bg-red-500 border border-red-500 p-4 pr-6 rounded-lg flex items-start gap-4">
                  <TriangleAlert className="w-6 basis-6 shrink-0 grow-0" /> 
                  <span className="whitespace-pre-line">{error}</span> 
                </p>
              }
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
