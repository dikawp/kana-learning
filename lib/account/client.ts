export class AccountApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function accountRequest<T>(path: string, body?: unknown, method = "POST", signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method: body === undefined ? "GET" : method,
    credentials: "same-origin", cache: "no-store", signal,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const value = await response.json()
  if (!response.ok) throw new AccountApiError(value.error?.message ?? "Account request failed.", response.status)
  return value as T
}

// Retain this operation across retry clicks. Only a confirmed result discards its request ID.
export function accountMutation<T>(path: string, payload: Record<string, unknown>, method = "POST") {
  const requestId = crypto.randomUUID()
  return () => accountRequest<T>(path, { ...payload, requestId }, method)
}
