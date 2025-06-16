import { handlePortfolio } from "./routes/portfolio";
import { handleLogin } from "./routes/login";
import { handleTrade } from "./routes/trade";
import { handleUpdateMarket } from "./routes/updateMarket";
import { handleMining } from "./routes/mining";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    const router = {
      "/portfolio": handlePortfolio,
      "/login": handleLogin,
      "/trade": handleTrade,
      "/update-market": handleUpdateMarket,
      "/mining": handleMining
    };

    const routeHandler = router[pathname as keyof typeof router];
    if (routeHandler) return routeHandler(req, env);

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
