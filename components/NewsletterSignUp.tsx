"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { UserRound } from "lucide-react";

export function NewsletterSignUp() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "Successfully subscribed!" });
        setEmail("");
        setFirstName("");
        setLastName("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to subscribe. Please try again." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-qlack text-qaupe mt-24">
      <div className="max-w-maxw mx-auto px-container py-16 space-y-8">
        <div className="w-20 h-auto md:ml-[160px]">
          <Logo variant="white" />
        </div>
        <div className="md:flex">
          <h2 className="md:basis-[160px] uppercase tracking-[0.04em]">Newsletter</h2>
          <p className="text-6xl tracking-[-0.03em] max-w-250">
            <span className="text-qellow">Sign up</span> and stay informed with all the latest in qual.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="form max-w-2xl md:ml-[160px]">
          {/* <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div>
              <Label htmlFor="firstName" className="text-qaupe">
                First Name <span className="text-qaupe/60 font-normal">(optional)</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-qaupe">
                Last Name <span className="text-qaupe/60 font-normal">(optional)</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
          </div> */}
          
          <div className="mt-12 flex flex-col md:flex-row items-center gap-4">
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-qaupe! text-qreen-dark placeholder:text-qreen-dark/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="text-qellow border-qellow h-[calc(100%-4px)] hover:bg-qellow hover:text-qlack hover:border-qellow cursor-pointer flex w-full md:w-auto md:inline-flex"
            >
            <UserRound className="w-4 h-4" /> {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>


          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-qreen/20 text-qreen border border-qreen/30"
                  : "bg-red/20 text-red border border-red/30"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}