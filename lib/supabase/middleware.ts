import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — do NOT remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const sessionCookie = request.cookies.get("session_login_time");
    if (!sessionCookie) {
      supabaseResponse.cookies.set("session_login_time", String(Date.now()), {
        maxAge: 2 * 24 * 60 * 60, // 2 days
        path: "/",
      });
    } else {
      const loginTime = Number(sessionCookie.value);
      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
      if (Date.now() - loginTime > TWO_DAYS_MS) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.delete("session_login_time");
        return redirectResponse;
      }
    }
  } else {
    supabaseResponse.cookies.delete("session_login_time");
  }

  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard", "/chat", "/agents", "/settings"];
  const authPaths = ["/login", "/signup"];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
