import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './src/lib/supabase/database.types'; // Ensure this path is correct

export async function middleware(req: NextRequest) {
  console.log("--- Middleware START ---");
  console.log("Pathname:", req.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create a Supabase client using the SSR package
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,         // Pass Supabase URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Pass Supabase Anon Key
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  console.log("Middleware: Calling getSession (using @supabase/ssr)...");
  // Fetch session. This now correctly reads and verifies the session from cookies.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log("Middleware: getSession returned. Session:", !!session, "Error:", sessionError);

  const { pathname } = req.nextUrl;
  const publicRoutes = ['/', '/login', '/logo.png', '/qr.png', '/cover.png'];

  // Redirect logic (remains the same)
  if (!session && !publicRoutes.includes(pathname)) {
    console.log('Middleware: No session, attempting redirect to /login from', pathname);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (session && pathname === '/login') {
    console.log('Middleware: Session found, attempting redirect from /login to /dashboard');
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  console.log("--- Middleware END (allowing request) ---");
  return response; // Return the potentially modified response (with cookies set)
}

// Matcher config (remains the same)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes, if you have any that should be public)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
