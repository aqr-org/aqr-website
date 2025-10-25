import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavigationLogo() {
  return (
    <Link href="/" className="w-20 h-20 inline-flex items-center" aria-label="Home">
      <Logo />
    </Link>
  );
}
