import { json } from "../utils/response";
import { verifyToken } from "../utils/auth";
import { getUserKey } from "../utils/kv";
import type { Env } from "../utils/types";

export async function portfolioRoute(req: Request, env: Env): Promise<Response> {
  const kv = env.ASSET_KV;
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!username || !token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const isValid = verifyToken(token, username);
  if (!isValid) {
    return json({ error: "Token expired or invalid" }, 403);
  }

  const key = getUserKey(username);
  const userData = await kv.get(key, { type: "json" });

  if (!userData) {
    return json({ error: "User not found" }, 404);
  }

  return json({ data: userData });
}
