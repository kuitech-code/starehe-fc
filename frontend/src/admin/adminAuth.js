const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOKEN_KEY = "stareheAdminToken";
const API_HOST = new URL(API_ORIGIN).origin;

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function signOutAdmin() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function signInAdmin(password) {
  let response;

  try {
    response = await fetch(`${API_ORIGIN}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new Error("Could not reach the backend. Make sure it is running.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Could not sign in.");
  }

  sessionStorage.setItem(TOKEN_KEY, data.token);
}

export async function checkAdminSession() {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_ORIGIN}/api/admin/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      signOutAdmin();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function requestNeedsAdminToken(url, method) {
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);

  if (!safeMethod) {
    return url.pathname.startsWith("/api/");
  }

  const isPublishedNews =
    /^\/api\/news\/published\/?$/.test(url.pathname);

  const isPublicStandings =
    /^\/api\/table\/standings\/?$/.test(url.pathname);

  const adminNewsRequest =
    url.pathname.startsWith("/api/news") && !isPublishedNews;

  const adminTableRequest =
    url.pathname.startsWith("/api/table") && !isPublicStandings;

  return adminNewsRequest || adminTableRequest;
}

export function installAdminFetchAuth() {
  if (
    typeof window === "undefined" ||
    window.__stareheAdminFetchInstalled
  ) {
    return;
  }

  window.__stareheAdminFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, options = {}) => {
    const inputUrl = input instanceof Request ? input.url : input;
    const url = new URL(inputUrl, window.location.href);
    const method = (
      options.method ||
      (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    if (
      url.origin !== API_HOST ||
      !requestNeedsAdminToken(url, method)
    ) {
      return originalFetch(input, options);
    }

    const token = getAdminToken();
    const headers = new Headers(
      input instanceof Request ? input.headers : undefined
    );

    new Headers(options.headers).forEach((value, key) => {
      headers.set(key, value);
    });

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await originalFetch(input, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      signOutAdmin();
      window.dispatchEvent(
        new Event("starehe-admin-session-expired")
      );
    }

    return response;
  };
}