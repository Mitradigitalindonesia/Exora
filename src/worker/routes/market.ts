// src/backend/handlers/market.ts
import { json, unauthorized } from "../utils/response";
import { verifyToken } from "../utils/auth";
import { Env } from "../utils/types";

const getPoolKey = (symbol: string) => `POOL_${symbol}`;
const getUserKey = (username: string) => `USER_${username}`;

export async function handleMarket(req: Request, env: Env) {
  const pools: Record<string, { idr: number, aset: number }> = {};
  const keys = await env.ASSET_KV.list({ prefix: "POOL_" });
  for (const k of keys.keys) {
    const symbol = k.name.replace("POOL_", "");
    const value = await env.ASSET_KV.get(k.name, { type: "json" });
    if (value) pools[symbol] = value;
  }
  return json({ market: pools });
}

export async function handleBuy(req: Request, env: Env) {
  const { username, symbol, jumlah } = await req.json();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!username || !symbol || !jumlah || !token) return unauthorized();

  if (!(await verifyToken(token, username, env))) return unauthorized();

  const userKey = getUserKey(username);
  const poolKey = getPoolKey(symbol);

  const [userData, pool] = await Promise.all([
    env.ASSET_KV.get(userKey, { type: "json" }),
    env.ASSET_KV.get(poolKey, { type: "json" }),
  ]);

  if (!userData || !pool) return json({ error: "Data tidak ditemukan" }, 404);

  const harga = pool.idr / pool.aset;
  const totalHarga = jumlah * harga;

  if (userData.idr < totalHarga)
    return json({ error: "Saldo IDR tidak cukup" }, 400);

  // Update pool
  pool.idr += totalHarga;
  pool.aset -= jumlah;

  // Update user
  userData.idr -= totalHarga;
  if (!userData.crypto.aset[symbol])
    userData.crypto.aset[symbol] = { transaksi: [] };
  userData.crypto.aset[symbol].transaksi.push({ jumlah, harga });

  await Promise.all([
    env.ASSET_KV.put(poolKey, JSON.stringify(pool)),
    env.ASSET_KV.put(userKey, JSON.stringify(userData)),
  ]);

  return json({ success: true, harga, jumlah, total: totalHarga });
}

export async function handleSell(req: Request, env: Env) {
  const { username, symbol, jumlah } = await req.json();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!username || !symbol || !jumlah || !token) return unauthorized();

  if (!(await verifyToken(token, username, env))) return unauthorized();

  const userKey = getUserKey(username);
  const poolKey = getPoolKey(symbol);

  const [userData, pool] = await Promise.all([
    env.ASSET_KV.get(userKey, { type: "json" }),
    env.ASSET_KV.get(poolKey, { type: "json" }),
  ]);

  if (!userData || !pool) return json({ error: "Data tidak ditemukan" }, 404);

  const asetUser = userData.crypto.aset[symbol]?.transaksi || [];
  const totalAset = asetUser.reduce((a, b) => a + b.jumlah, 0);

  if (totalAset < jumlah)
    return json({ error: "Aset tidak mencukupi untuk dijual" }, 400);

  const harga = pool.idr / pool.aset;
  const totalIDR = jumlah * harga;

  // Update pool
  pool.idr -= totalIDR;
  pool.aset += jumlah;

  // Update user
  userData.idr += totalIDR;
  userData.crypto.aset[symbol].transaksi.push({ jumlah: -jumlah, harga });

  await Promise.all([
    env.ASSET_KV.put(poolKey, JSON.stringify(pool)),
    env.ASSET_KV.put(userKey, JSON.stringify(userData)),
  ]);

  return json({ success: true, harga, jumlah, total: totalIDR });
}
