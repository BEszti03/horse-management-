// src/utils/api.js
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  // opcionális: egységes hibakezelés
  if (!res.ok) {
    let msg = "Hiba történt.";
    try {
      const data = await res.json();
      msg = data.message || data.error || msg;
    } catch {}
    throw new Error(msg);
  }

  // ha van üres body, ne dőlj el
  try {
    return await res.json();
  } catch {
    return null;
  }
}
