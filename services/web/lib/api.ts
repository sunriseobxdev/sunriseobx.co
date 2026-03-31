export async function apiFetch(
  path: string,
  opts?: RequestInit
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Extract token from cookie (client-side)
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/sunriseobx_token=([^;]+)/);
    if (match) {
      headers["Authorization"] = `Bearer ${match[1]}`;
    }
  }

  const res = await fetch(path, {
    ...opts,
    headers: {
      ...headers,
      ...opts?.headers,
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res;
}
