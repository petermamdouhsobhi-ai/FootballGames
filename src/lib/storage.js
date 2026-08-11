import { fbGet, fbSet, fbDelete } from "./firebase";

// Same shape as Claude's artifact window.storage API, so the game code
// (App.jsx) barely had to change: get/set/delete(key, shared).
// shared=true  -> stored in Firebase Realtime Database (visible to everyone)
// shared=false -> stored in this browser's localStorage (private to this device)
export const storage = {
  async get(key, shared) {
    if (shared) return fbGet(key);
    try {
      const v = localStorage.getItem(key);
      return v ? { key, value: v, shared: false } : null;
    } catch {
      return null;
    }
  },
  async set(key, value, shared) {
    if (shared) return fbSet(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {}
    return { key, value, shared: false };
  },
  async delete(key, shared) {
    if (shared) return fbDelete(key);
    try {
      localStorage.removeItem(key);
    } catch {}
    return { key, deleted: true, shared: false };
  },
};
