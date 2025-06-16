import { json } from "../utils/response";
import { verifyToken } from "../utils/auth";
import { getUserKey } from "../utils/kv";
import type { Env } from "../utils/types";

export async function tradeRoute(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const { username, symbol, jumlah, harga } = await req.json();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!username || !token || !symbol || !jumlah || !harga) {
    return json({ error: "Invalid payload" }, 400);
  }

  const isValid = verifyToken(token, username);
  if (!isValid) return json({ error: "Token expired or invalid" }, 403);

  const key = getUserKey(username);
  const userData = await env.ASSET_KV.get(key, { type: "json" });

  if (!userData) return json({ error: "User not found" }, 404);

  const totalHarga = jumlah * harga;

  if (jumlah > 0) {
    // Beli
    if (userData.idr < totalHarga) return json({ error: "Saldo tidak cukup" }, 400);
    userData.idr -= totalHarga;
  } else {
    // Jual
    const transaksi = userData.crypto.aset[symbol]?.transaksi || [];
    const totalJumlah = transaksi.reduce((a, b) => a + b.jumlah, 0);
    if (totalJumlah < -jumlah) return json({ error: "Aset tidak cukup" }, 400);
    userData.idr += -jumlah * harga;
  }

  if (!userData.crypto.aset[symbol]) {
    userData.crypto.aset[symbol] = { transaksi: [] };
  }

  userData.crypto.aset[symbol].transaksi.push({ jumlah, harga });

  await env.ASSET_KV.put(key, JSON.stringify(userData));
  return json({ success: true });
}
