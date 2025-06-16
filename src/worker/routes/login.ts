import { handleAuth } from "../handlers/login";
import type { Env } from "../utils/types";

export async function loginRoute(req: Request, env: Env): Promise<Response> {
  return handleAuth(req, env);
}
