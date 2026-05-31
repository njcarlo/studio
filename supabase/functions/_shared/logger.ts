export function logError(module: string, method: string, route: string, error: unknown): void {
  console.error(JSON.stringify({
    level: 'error',
    module,
    method,
    route,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  }))
}
