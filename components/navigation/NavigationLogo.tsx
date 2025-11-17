import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavigationLogo() {
  return (
    <Link href="/" className="w-20 h-20 md:w-[88px] md:h-[77px] inline-flex items-center" aria-label="Home">
      <Logo />
    </Link>
  );
}
