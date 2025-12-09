import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-8">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  );
}
