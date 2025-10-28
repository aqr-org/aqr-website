import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-8">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
