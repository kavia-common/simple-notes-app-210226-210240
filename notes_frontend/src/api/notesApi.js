const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Resolve the backend base URL from environment variables.
 * Priority:
 *  - REACT_APP_API_BASE
 *  - REACT_APP_BACKEND_URL
 *
 * Falls back to empty string (same-origin) to support reverse-proxy deployments.
 */
function getApiBaseUrl() {
  const base =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();

  // Remove trailing slashes to prevent double-slash issues when joining paths.
  return base.replace(/\/+$/, "");
}

function withTimeout(signal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const abort = () => {
    window.clearTimeout(timeoutId);
    controller.abort();
  };

  // If caller passed a signal, mirror aborts into our controller.
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  return { signal: controller.signal, clear: () => window.clearTimeout(timeoutId) };
}

async function requestJson(path, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const { clear, signal } = withTimeout(options.signal);

  try {
    const res = await fetch(url, {
      ...options,
      signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
      const message =
        (payload && typeof payload === "object" && (payload.detail || payload.message)) ||
        (typeof payload === "string" && payload) ||
        `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } finally {
    clear();
  }
}

/**
 * Attempts to normalize various potential backend response shapes to a notes array.
 * Accepts:
 *  - array
 *  - { notes: [...] }
 *  - { items: [...] }
 *  - { data: [...] }
 */
function normalizeNotesList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.notes)) return payload.notes;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes. */
  const payload = await requestJson("/notes", { method: "GET" });
  return normalizeNotesList(payload);
}

// PUBLIC_INTERFACE
export async function createNote(note) {
  /** Create a note. Expects { title, content }. */
  return requestJson("/notes", {
    method: "POST",
    body: JSON.stringify(note)
  });
}

// PUBLIC_INTERFACE
export async function updateNote(id, note) {
  /** Update a note by id. Expects { title, content }. */
  return requestJson(`/notes/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(note)
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. */
  return requestJson(`/notes/${encodeURIComponent(String(id))}`, {
    method: "DELETE"
  });
}
