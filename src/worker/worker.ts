
import { handleAuth } from "./routes/auth";
import { handlePortfolio } from "./routes/portfolio";
import { handleTrade } from "./routes/trade";
import { handleMining } from "./routes/mining";
import { handleUpdateMarket } from "./routes/updateMarket";

import { corsHeaders } from "./utils/response";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;
    const method = req.method;

    // Tangani preflight CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Routing berdasarkan endpoint
    if (pathname === "/login" && method === "POST") {
      return handleAuth(req, env);
    }

    if (pathname === "/portfolio" && method === "GET") {
      return handlePortfolio(req, env);
    }

    if (pathname === "/trade" && method === "POST") {
      return handleTrade(req, env);
    }

    if (pathname === "/mining" && method === "POST") {
      return handleMining(req, env);
    }

    if (pathname === "/update-market" && method === "GET") {
      return handleUpdateMarket(req, env);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
