'use client';

import { Suspense, ComponentProps } from 'react';
import Link from 'next/link';
import NavigationLink from './NavigationLink';

interface SuspenseNavigationLinkProps extends ComponentProps<typeof NavigationLink> {
  href: string;
}

/**
 * Wraps NavigationLink in Suspense to handle useSearchParams() requirement in Next.js 16.
 * This allows the parent component to be a server component while only the link needs Suspense.
 * The fallback renders a plain Link to prevent layout shift while maintaining the same structure.
 */
export default function SuspenseNavigationLink({ children, className, href, ...props }: SuspenseNavigationLinkProps) {
  return (
    <Suspense fallback={
      <Link href={href} className={className} {...props}>
        {children}
      </Link>
    }>
      <NavigationLink href={href} className={className} {...props}>
        {children}
      </NavigationLink>
    </Suspense>
  );
}

