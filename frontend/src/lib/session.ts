const KEY_SID = "pfs.session_id";
const KEY_NAME = "pfs.user_name";

export const session = {
  get id(): string | null {
    return localStorage.getItem(KEY_SID);
  },
  get name(): string | null {
    return localStorage.getItem(KEY_NAME);
  },
  set(id: string, name: string) {
    localStorage.setItem(KEY_SID, id);
    localStorage.setItem(KEY_NAME, name);
  },
  clear() {
    localStorage.removeItem(KEY_SID);
    localStorage.removeItem(KEY_NAME);
  },
};
