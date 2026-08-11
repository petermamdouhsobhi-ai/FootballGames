import { DATABASE_URL } from "../firebaseConfig";

function urlFor(key) {
  // Firebase RTDB REST API: GET/PUT/DELETE https://<db>.firebasedatabase.app/<path>.json
  return `${DATABASE_URL}/${encodeURIComponent(key)}.json`;
}

export async function fbGet(key) {
  try {
    const res = await fetch(urlFor(key));
    if (!res.ok) return null;
    const data = await res.json();
    if (data === null || data === undefined) return null;
    return { key, value: JSON.stringify(data), shared: true };
  } catch {
    return null;
  }
}

export async function fbSet(key, value) {
  try {
    // value is already a JSON string (e.g. JSON.stringify(room)) -> valid PUT body
    const res = await fetch(urlFor(key), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: value,
    });
    if (!res.ok) return null;
    return { key, value, shared: true };
  } catch {
    return null;
  }
}

export async function fbDelete(key) {
  try {
    const res = await fetch(urlFor(key), { method: "DELETE" });
    if (!res.ok) return null;
    return { key, deleted: true, shared: true };
  } catch {
    return null;
  }
}
