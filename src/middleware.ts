import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";

const PUBLICAS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_SESSAO)?.value;
  const sessao = token ? await lerToken(token) : null;

  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // link de redefinicao deve funcionar mesmo com uma sessao ja aberta no navegador.
    if (sessao && pathname !== "/login/redefinir-senha") {
      return NextResponse.redirect(new URL("/personagens", req.url));
    }
    return NextResponse.next();
  }

  if (!sessao) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("de", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
