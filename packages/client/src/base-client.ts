export class ClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ClientError'
  }
}

export class BaseClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly getToken: () => Promise<string | null>
  ) {}

  protected async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken()
    if (!token) throw new ClientError(401, 'No authentication token')
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new ClientError(res.status, data?.error ?? 'Request failed', data?.details)
    return data as T
  }

  protected get<T>(path: string) { return this.request<T>('GET', path) }
  protected post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body) }
  protected put<T>(path: string, body?: unknown) { return this.request<T>('PUT', path, body) }
  protected del<T>(path: string) { return this.request<T>('DELETE', path) }
}
