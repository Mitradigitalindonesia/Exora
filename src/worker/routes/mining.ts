import { json } from "../utils/response";
import { verifyToken } from "../utils/auth";
import { getUserKey } from "../utils/kv";
import type { Env } from "../utils/types";

// Daftar aset yang bisa ditambang
const MINABLE_ASSETS = ["ore", "iron", "crystal", "dark"];

export async function miningRoute(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const { username, symbol } = await req.json();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!username || !token || !symbol) {
    return json({ error: "Invalid payload" }, 400);
  }

  if (!MINABLE_ASSETS.includes(symbol)) {
    return json({ error: "Aset tidak bisa ditambang" }, 400);
  }

  const isValid = verifyToken(token, username);
  if (!isValid) return json({ error: "Token expired or invalid" }, 403);

  const poolKey = `POOL_${symbol}_${getTodayKey()}`;
  const remaining = parseFloat(await env.ASSET_KV.get(poolKey) || "0");
  if (remaining <= 0) {
    return json({ error: "Pool habis hari ini" }, 400);
  }

  const reward = Math.min(1, remaining); // reward tetap 1, bisa diatur lebih dinamis
  await env.ASSET_KV.put(poolKey, (remaining - reward).toString());

  const userKey = getUserKey(username);
  const userData = await env.ASSET_KV.get(userKey, { type: "json" });

  if (!userData) return json({ error: "User not found" }, 404);

  if (!userData.crypto.aset[symbol]) {
    userData.crypto.aset[symbol] = { transaksi: [] };
  }

  userData.crypto.aset[symbol].transaksi.push({
    jumlah: reward,
    harga: 0, // karena hasil mining, bukan beli
    dariMining: true,
  });

  await env.ASSET_KV.put(userKey, JSON.stringify(userData));
  return json({ success: true, reward });
}

// Fungsi bantu bikin key pool harian
function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
