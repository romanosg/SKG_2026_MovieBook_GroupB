export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Sends a request to the server and returns its JSON answer.
// If the request fails it throws an Error with the server's message and these extras:
//   error.status      the HTTP status (404, 401, ...)
//   error.hasMessage  true when the server itself answered (false: e.g. the route doesn't exist)
// auth: true sends the logged-in user's token.
export async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // The server answers in JSON. If it isn't JSON (e.g. the route is missing), data is null.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.hasMessage = Boolean(data?.message);
    throw error;
  }
  return data;
}

// Logs the user out of this browser (the header bar updates by itself)
export function clearLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("authChange"));
}
