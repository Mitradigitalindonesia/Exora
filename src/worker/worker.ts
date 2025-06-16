import { handleAuth } from "./routes/auth";
import { handleLogin } from "./routes/login";
import { handlePortfolio } from "./routes/portfolio";
import { handleMining } from "./routes/mining";
import { handleTrade } from "./routes/trade";
import { handleMarket, handleBuy, handleSell } from "./routes/market";
import { Env } from "./utils/types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    if (pathname === "/auth") return handleAuth(request, env);
    if (pathname === "/login") return handleLogin(request, env);
    if (pathname === "/portfolio") return handlePortfolio(request, env);
    if (pathname === "/mining") return handleMining(request, env);
    if (pathname === "/trade") return handleTrade(request, env);

    if (pathname === "/market") return handleMarket(request, env);
    if (pathname === "/market/buy" && method === "POST")
      return handleBuy(request, env);
    if (pathname === "/market/sell" && method === "POST")
      return handleSell(request, env);

    return new Response("Not Found", { status: 404 });
  },
};
