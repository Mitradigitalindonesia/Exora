import { json } from "../utils/response";
import { getUserKey } from "../utils/kv";
import { generateUserToken } from "../utils/auth";

export async function handleAuth(req: Request, env: Env): Promise<Response> {
  const kv = env.ASSET_KV;
  const body = await req.json();
  const { username, token } = body;

  if (!username || !token) {
    return json({ error: "Missing credentials" }, 400);
  }

  // Admin login
  if (token === "AutobotX") {
    return json({ success: true, token: "AutobotX", username });
  }

  // User login
  const key = getUserKey(username);
  let userData = await kv.get(key, { type: "json" });

  if (!userData) {
    // Buat data awal user baru
    const coins = await kv.get("Crypto", { type: "json" }) || {};
    const market = Object.fromEntries(
      Object.entries(coins).slice(0, 200).map(([symbol, v]: any) => [
        symbol,
        { nama: v.nama, harga: v.harga, image: v.image }
      ])
    );

    userData = {
      idr: 10000,
      crypto: {
        market,
        aset: {}
      }
    };

    await kv.put(key, JSON.stringify(userData));
  }

  const userToken = generateUserToken(username);
  return json({ success: true, token: userToken, username });
}
