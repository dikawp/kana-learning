import type { NextRequest } from "next/server"
import { refreshSession } from "./server/auth/refresh"

export async function proxy(request: NextRequest) { return refreshSession(request) }
export const config = { matcher: ["/account/:path*"] }
