import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return {
    stats: [
      { value: "10,000+", label: "Hardware Items" },
      { value: "5,000+", label: "Community Members" },
      { value: "2,500+", label: "Build Guides" },
      { value: "15,000+", label: "Price Points Tracked" },
    ],
    features: [
      {
        title: "Enterprise Hardware",
        description:
          "Discover used enterprise-grade servers, storage, and networking equipment at unbeatable prices.",
      },
      {
        title: "Price Tracking",
        description:
          "Track price history and trends to find the best deals on the hardware you need.",
      },
      {
        title: "Advanced Search",
        description:
          "Filter by specifications, condition, price range, and more to find exactly what you need.",
      },
      {
        title: "Community Builds",
        description:
          "Share your homelab builds and get inspiration from the community.",
      },
      {
        title: "Comprehensive Database",
        description:
          "Detailed specifications, reviews, and compatibility information for thousands of items.",
      },
      {
        title: "Performance Insights",
        description:
          "Real-world performance data and benchmarks from the homelab community.",
      },
    ],
  };
};
