import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isOrganizerRoute = request.nextUrl.pathname.startsWith('/organizer')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAdminSubRoute = request.nextUrl.pathname.startsWith('/admin/')
  // /professional (exact) and /professional/* — but NOT /professionals/* (public directory)
  const isProfessionalDashboardRoute =
    request.nextUrl.pathname === '/professional' ||
    request.nextUrl.pathname.startsWith('/professional/')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')

  if (!user && (isDashboardRoute || isOrganizerRoute || isAdminSubRoute || isProfessionalDashboardRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based protection
  if (user) {
    // Prefer user_metadata.role (set at account creation / admin script) as the primary source.
    // This avoids RLS blocking the profile lookup in middleware context for super_admin accounts
    // whose profiles row may not be readable through the anon key.
    const metaRole = user.user_metadata?.role as string | undefined

    // Only hit the DB if the JWT metadata doesn't already contain a recognised admin role
    let userRole = metaRole
    if (!metaRole || (metaRole !== 'admin' && metaRole !== 'super_admin' && metaRole !== 'vendor')) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      userRole = profile?.role || metaRole
    }

    if (isOrganizerRoute && userRole !== 'vendor' && userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isAdminRoute && userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
