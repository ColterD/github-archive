import { z } from "zod";
import type { RequestHandler } from "@sveltejs/kit";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  condition: z.string().optional(),
  sort: z.string().optional(),
});

export const GET: RequestHandler = async ({ url }) => {
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
      status: 400,
    });
  }
  // Placeholder: return empty list
  return new Response(
    JSON.stringify({ items: [], total: 0, page: 1, totalPages: 1 }),
    { status: 200 },
  );
};
