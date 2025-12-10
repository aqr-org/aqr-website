import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {params?.error ? params.error : 'Sorry, something went wrong.'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <div className="space-y-6">
                  <p className="font-semibold flex items-center gap-1">
                    What happened:
                  </p>
                  {params.error === 'Email link is invalid or has expired' ? (
                    <>
                      <ul className="space-y-6 mb-12">
                        <li>
                          <p className="mb-1">
                            Confirmation links are valid for 60 minutes.
                          </p> 
                          <p className="text-sm">
                            Received the confirmation more than 1 hour ago? <br />
                            Please try <Link href="/auth/sign-up" className="underline underline-offset-4 font-semibold">signing up</Link> again to request a new confirmation link.
                          </p>
                        </li>
                        <li>
                          <p className="mb-1">
                            Confirmation links only work once.
                          </p> 
                          <p className="text-sm">
                            Already confirmed your email? <br />
                            Please <Link href="/auth/login" className="underline underline-offset-4 font-semibold">log&nbsp;in</Link> with your email and password.
                          </p>
                        </li>

                      </ul>
                      <div className="flex justify-between gap-6">
                        <Button size='sm' className="w-full">
                          <Link href="/auth/sign-up">Sign up</Link>
                        </Button>
                        <Button size='sm' className="w-full">
                          <Link href="/auth/login">Log in</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-6">
                        This is an unknown error. If you keep experiencing issues, please contact support.
                      </p>
                      <Button size='sm'>
                        <Link href="/">Back to Homepage</Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  An unspecified error occurred.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
