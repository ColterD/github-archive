import { z } from "zod";
import type { RequestHandler } from "@sveltejs/kit";

const querySchema = z.object({
  q: z.string().min(1),
});

export const GET: RequestHandler = async ({ url }) => {
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
      status: 400,
    });
  }
  // Placeholder: return empty search results
  return new Response(JSON.stringify({ hits: [], total: 0 }), { status: 200 });
};
