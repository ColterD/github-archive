import { writable } from "svelte/store";

export const search = writable("");
export const filters = writable({
  category: "All",
  price: [0, 10000],
  condition: "All",
});
export const sort = writable("relevance");
export const page = writable(1);
export const totalPages = writable(1);
export const comparison = writable([]);
