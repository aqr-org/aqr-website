import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Static redirects (specific redirects that need custom destinations)
  if (pathname === '/dir/alpha.cgi?letter=a') {
    return NextResponse.redirect(new URL('/dir', request.url), 301);
  }
  if (
    pathname === '/dir/sectors.shtml' || 
    pathname === '/dir/expertise.shtml' || 
    pathname === '/dir/recruitment.shtml' || 
    pathname === '/dir/countries.shtml'
  ) {
    return NextResponse.redirect(new URL('/dir/advanced', request.url), 301);
  }
  if (pathname === '/memberlogo') {
    return NextResponse.redirect(new URL('/members/memberlogo', request.url), 301);
  }
  if (pathname === '/members/apply.shtml') {
    return NextResponse.redirect(new URL('/members/new-membership-application', request.url), 301);
  }
  if (pathname === '/watch/b2_GSlxv834') {
    return NextResponse.redirect(new URL('/resources/past-present-and-future', request.url), 301);
  }
  if (pathname === '/a/ras.shtml') {
    return NextResponse.redirect(new URL('/events/thehub/recruiter-accreditation-scheme', request.url), 301);
  }
  if (pathname === '/refsection/safety-guidance.shtml') {
    return NextResponse.redirect(new URL('/resources/safety-guidance', request.url), 301);
  }
  if (pathname === '/refsection/data-quality-excellence-pledge.shtml') {
    return NextResponse.redirect(new URL('/resources/data-quality-excellence-pledge', request.url), 301);
  }

  // General rule: Remove .shtml suffix from any pathname (applies to all other .shtml paths)
  if (pathname.endsWith('.shtml')) {
    const pathWithoutShtml = pathname.slice(0, -6); // Remove '.shtml' suffix
    return NextResponse.redirect(
      new URL(pathWithoutShtml + (searchParams.toString() ? `?${searchParams.toString()}` : ''), request.url),
      301
    );
  }
  if (pathname === '/watch/OXkJcVxZZAc') {
    return NextResponse.redirect(new URL('/careers/a-typical-qual-project', request.url), 301);
  }

  // Redirect /a and /a/articlename to /resources/inspiration
  if (pathname === '/a') {
    return NextResponse.redirect(new URL('/resources/inspiration', request.url), 301);
  }
  if (pathname === '/a/authors.cgi') {
    return NextResponse.redirect(new URL('/resources/inspiration', request.url), 301);
  }
  if (pathname.startsWith('/a/')) {
    let articleName = pathname.slice(3); // Remove '/a/' prefix
    // Remove .cgi suffix if present
    if (articleName.endsWith('.cgi')) {
      articleName = articleName.slice(0, -4); // Remove '.cgi' suffix
    }
    if (articleName) {
      return NextResponse.redirect(
        new URL(`/resources/inspiration/${articleName}`, request.url),
        301
      );
    }
  }

  // Dynamic redirect: old company directory URL format
  // /dir/view.cgi?ident=companyname -> /dir/companies/companyname
  if (pathname === '/dir/view.cgi') {
    const ident = searchParams.get('ident');
    if (ident) {
      return NextResponse.redirect(
        new URL(`/dir/companies/${ident}`, request.url),
        301
      );
    }
  }
  if (pathname === '/dir/search.cgi') {
    const gradprog = searchParams.get('gradprog');
    if (gradprog) {
      return NextResponse.redirect(
        new URL(`/dir/advanced?gradProg=true`, request.url),
        301
      );
    }
  }
  if (pathname === '/contacts') {
    const file = searchParams.get('file');
    if (file) {
      return NextResponse.redirect(
        new URL(`/contacts/${file}`, request.url),
        301
      );
    }
  }

  // Continue with Supabase session update for all other requests
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
