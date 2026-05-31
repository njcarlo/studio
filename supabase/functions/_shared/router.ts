import type { AuthContext } from './auth.ts'

export type Handler = (
  req: Request,
  ctx: AuthContext,
  params: Record<string, string>,
  url: URL,
) => Promise<Response>

export interface Route {
  method: string
  pattern: string
  handler: Handler
}

export type RouteMap = Route[]

export function matchRoute(
  routes: RouteMap,
  method: string,
  pathname: string,
): { handler: Handler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchPattern(route.pattern, pathname)
    if (params !== null) return { handler: route.handler, params }
  }
  return null
}

function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean)
  const ap = path.split('/').filter(Boolean)
  if (pp.length !== ap.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i])
    } else if (pp[i] !== ap[i]) {
      return null
    }
  }
  return params
}
