export async function validateToken(req: Request, username: string): Promise<boolean> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;

  if (token === "AutobotX") return true; // token admin

  try {
    const data = JSON.parse(atob(token));
    if (data.username !== username) return false;
    const expire = data.expire;
    if (Date.now() > expire) return false;
    return true;
  } catch {
    return false;
  }
}

export function generateUserToken(username: string): string {
  const expire = Date.now() + 24 * 60 * 60 * 1000; // 24 jam
  const payload = { username, expire };
  return btoa(JSON.stringify(payload));
}
