// HARDWARE LISTING PAGE - Server-side data loading
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  // Extract query parameters
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const manufacturer = url.searchParams.get("manufacturer") || "";
  const priceMin = parseInt(url.searchParams.get("priceMin") || "0");
  const priceMax = parseInt(url.searchParams.get("priceMax") || "10000");
  const sort = url.searchParams.get("sort") || "name-asc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const itemsPerPage = 24;

  // Mock hardware data that matches the enhanced component interface
  const mockHardware = [
    {
      id: "1",
      name: "Dell PowerEdge R720",
      slug: "dell-poweredge-r720",
      model: "R720",
      category: "SERVER",
      subcategory: "Rackmount Server",
      manufacturer: {
        name: "Dell",
        slug: "dell",
      },
      description:
        "Enterprise-grade 2U rackmount server with dual Xeon processors, perfect for virtualization and high-performance computing workloads.",
      currentPrice: 899,
      msrp: 2499,
      images: "/api/placeholder/400/300",
      viewCount: 1247,
      favoriteCount: 43,
      status: "AVAILABLE",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-10T00:00:00.000Z",
    },
    {
      id: "2",
      name: "HP ProLiant DL380 Gen9",
      slug: "hp-proliant-dl380-gen9",
      model: "DL380 Gen9",
      category: "SERVER",
      subcategory: "Rackmount Server",
      manufacturer: {
        name: "HP",
        slug: "hp",
      },
      description:
        "Reliable 2U server with excellent expandability and enterprise features for demanding applications.",
      currentPrice: 1299,
      msrp: 3200,
      images: "/api/placeholder/400/300",
      viewCount: 892,
      favoriteCount: 31,
      status: "AVAILABLE",
      createdAt: "2025-01-02T00:00:00.000Z",
      updatedAt: "2025-01-09T00:00:00.000Z",
    },
    {
      id: "3",
      name: "Cisco Catalyst 2960X-48T-L",
      slug: "cisco-catalyst-2960x-48t-l",
      model: "2960X-48T-L",
      category: "NETWORKING",
      subcategory: "Switch",
      manufacturer: {
        name: "Cisco",
        slug: "cisco",
      },
      description:
        "48-port Gigabit Ethernet switch with advanced security and management features.",
      currentPrice: 450,
      msrp: 1200,
      images: "/api/placeholder/400/300",
      viewCount: 634,
      favoriteCount: 22,
      status: "AVAILABLE",
      createdAt: "2025-01-03T00:00:00.000Z",
      updatedAt: "2025-01-08T00:00:00.000Z",
    },
    {
      id: "4",
      name: "EMC VNX5200 Storage Array",
      slug: "emc-vnx5200-storage-array",
      model: "VNX5200",
      category: "STORAGE",
      subcategory: "SAN Storage",
      manufacturer: {
        name: "EMC",
        slug: "emc",
      },
      description:
        "High-performance unified storage system with SSD and HDD tiers for enterprise applications.",
      currentPrice: 2999,
      msrp: 8500,
      images: "/api/placeholder/400/300",
      viewCount: 445,
      favoriteCount: 18,
      status: "AVAILABLE",
      createdAt: "2025-01-04T00:00:00.000Z",
      updatedAt: "2025-01-07T00:00:00.000Z",
    },
    {
      id: "5",
      name: "Intel Xeon E5-2690 v3",
      slug: "intel-xeon-e5-2690-v3",
      model: "E5-2690 v3",
      category: "COMPONENTS",
      subcategory: "CPU",
      manufacturer: {
        name: "Intel",
        slug: "intel",
      },
      description:
        "12-core, 24-thread server processor with 2.6GHz base frequency and 30MB cache.",
      currentPrice: 245,
      msrp: 2056,
      images: "/api/placeholder/400/300",
      viewCount: 1203,
      favoriteCount: 67,
      status: "AVAILABLE",
      createdAt: "2025-01-05T00:00:00.000Z",
      updatedAt: "2025-01-06T00:00:00.000Z",
    },
    {
      id: "6",
      name: "Samsung 32GB DDR4-2400 ECC",
      slug: "samsung-32gb-ddr4-2400-ecc",
      model: "M393A4K40BB1-CRC",
      category: "COMPONENTS",
      subcategory: "Memory",
      manufacturer: {
        name: "Samsung",
        slug: "samsung",
      },
      description:
        "Enterprise-grade 32GB DDR4 ECC registered memory module for server applications.",
      currentPrice: 89,
      msrp: 450,
      images: "/api/placeholder/400/300",
      viewCount: 756,
      favoriteCount: 29,
      status: "AVAILABLE",
      createdAt: "2025-01-06T00:00:00.000Z",
      updatedAt: "2025-01-05T00:00:00.000Z",
    },
  ];

  // Apply filters
  let filteredHardware = [...mockHardware];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredHardware = filteredHardware.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.manufacturer.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower),
    );
  }

  if (category) {
    filteredHardware = filteredHardware.filter(
      (item) => item.category === category,
    );
  }

  if (manufacturer) {
    filteredHardware = filteredHardware.filter(
      (item) =>
        item.manufacturer.name.toLowerCase() === manufacturer.toLowerCase(),
    );
  }

  if (priceMin > 0 || priceMax < 10000) {
    filteredHardware = filteredHardware.filter(
      (item) =>
        item.currentPrice &&
        item.currentPrice >= priceMin &&
        item.currentPrice <= priceMax,
    );
  }

  // Apply sorting
  const [sortField, sortDirection] = sort.split("-");
  filteredHardware.sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case "price":
        aVal = a.currentPrice || 0;
        bVal = b.currentPrice || 0;
        break;
      case "popularity":
        aVal = a.viewCount;
        bVal = b.viewCount;
        break;
      case "rating":
        aVal = a.favoriteCount;
        bVal = b.favoriteCount;
        break;
      case "newest":
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case "name":
      default:
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
    }

    if (sortDirection === "desc") {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
  });

  // Pagination
  const total = filteredHardware.length;
  const skip = (page - 1) * itemsPerPage;
  const paginatedHardware = filteredHardware.slice(skip, skip + itemsPerPage);

  // Mock categories and manufacturers
  const categories = [
    "SERVER",
    "STORAGE",
    "NETWORKING",
    "VIRTUALIZATION",
    "COMPONENTS",
    "ACCESSORIES",
  ];
  const manufacturers = [
    "Dell",
    "HP",
    "Cisco",
    "EMC",
    "Intel",
    "Samsung",
    "Supermicro",
    "Juniper",
  ];

  // Mock search suggestions
  const suggestions = [
    { type: "trending" as const, text: "Dell PowerEdge", count: 45 },
    { type: "trending" as const, text: "HP ProLiant", count: 38 },
    { type: "category" as const, text: "Servers", category: "SERVER" },
    { type: "category" as const, text: "Networking", category: "NETWORKING" },
    { type: "suggestion" as const, text: "Cisco switches" },
    { type: "suggestion" as const, text: "Enterprise storage" },
    { type: "recent" as const, text: search || "Recent search" },
  ];

  return {
    hardware: paginatedHardware,
    total,
    categories,
    manufacturers,
    filters: {
      search,
      category,
      manufacturer,
      priceMin,
      priceMax,
      sort,
      page,
    },
    suggestions: search
      ? suggestions.filter((s) =>
          s.text.toLowerCase().includes(search.toLowerCase()),
        )
      : suggestions,
  };
};
