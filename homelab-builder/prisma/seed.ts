// HOMELAB HARDWARE PLATFORM - DATABASE SEED SCRIPT
// Enterprise-grade seed data for development and testing
// Updated: 2025-01-09 - Web search verified hardware specifications

import {
  PrismaClient,
  UserRole,
  HardwareCategory,
  HardwareCondition,
  HardwareStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ====================================================================
  // MANUFACTURERS - Major Enterprise Hardware Vendors
  // ====================================================================
  console.log("📦 Seeding manufacturers...");

  const manufacturers = await Promise.all([
    prisma.manufacturer.upsert({
      where: { slug: "dell" },
      update: {},
      create: {
        name: "Dell Technologies",
        slug: "dell",
        website: "https://www.dell.com",
        description:
          "Leading enterprise hardware manufacturer specializing in servers, storage, and networking solutions.",
        logoUrl: "https://www.dell.com/assets/images/logo.png",
        metaTitle: "Dell Enterprise Hardware - Servers, Storage & Networking",
        metaDescription:
          "Explore Dell PowerEdge servers, PowerScale storage, and enterprise networking solutions for your homelab.",
      },
    }),
    prisma.manufacturer.upsert({
      where: { slug: "hp" },
      update: {},
      create: {
        name: "HP Enterprise",
        slug: "hp",
        website: "https://www.hpe.com",
        description:
          "Hewlett Packard Enterprise provides mission-critical IT infrastructure solutions.",
        logoUrl: "https://www.hpe.com/assets/images/logo.png",
        metaTitle: "HP Enterprise Hardware - ProLiant Servers & Storage",
        metaDescription:
          "Discover HP ProLiant servers, 3PAR storage, and enterprise solutions for homelab environments.",
      },
    }),
    prisma.manufacturer.upsert({
      where: { slug: "cisco" },
      update: {},
      create: {
        name: "Cisco Systems",
        slug: "cisco",
        website: "https://www.cisco.com",
        description:
          "World leader in networking hardware and enterprise infrastructure solutions.",
        logoUrl: "https://www.cisco.com/assets/images/logo.png",
        metaTitle: "Cisco Networking Hardware - Switches, Routers & UCS",
        metaDescription:
          "Professional Cisco networking equipment including Catalyst switches, ASA firewalls, and UCS servers.",
      },
    }),
    prisma.manufacturer.upsert({
      where: { slug: "supermicro" },
      update: {},
      create: {
        name: "Super Micro Computer",
        slug: "supermicro",
        website: "https://www.supermicro.com",
        description:
          "High-performance server and storage solutions for enterprise and cloud computing.",
        logoUrl: "https://www.supermicro.com/assets/images/logo.png",
        metaTitle: "Supermicro Servers - High-Performance Computing Solutions",
        metaDescription:
          "Supermicro server motherboards, chassis, and complete systems for enterprise applications.",
      },
    }),
  ]);

  // ====================================================================
  // HARDWARE ITEMS - Enterprise Surplus Hardware
  // ====================================================================
  console.log("🖥️ Seeding hardware items...");

  const hardwareItems = await Promise.all([
    // Dell PowerEdge Servers
    prisma.hardwareItem.upsert({
      where: { slug: "dell-poweredge-r720" },
      update: {},
      create: {
        name: "Dell PowerEdge R720",
        slug: "dell-poweredge-r720",
        model: "R720",
        partNumber: "R720-001",
        category: HardwareCategory.SERVER,
        subcategory: "2U Rack Server",
        manufacturerId: manufacturers[0].id, // Dell
        description:
          "Versatile 2U rack server ideal for virtualization, databases, and web serving applications. Popular choice for homelab environments.",
        specifications: JSON.stringify({
          cpu: {
            socket: "LGA 2011",
            maxCpus: 2,
            supportedProcessors: [
              "Intel Xeon E5-2600 v1",
              "Intel Xeon E5-2600 v2",
            ],
          },
          memory: {
            slots: 24,
            maxCapacity: "768GB",
            type: "DDR3 ECC",
            speed: ["1333MHz", "1600MHz"],
          },
          storage: {
            bays: 8,
            type: '2.5" SAS/SATA',
            raidController: "PERC H710",
            maxCapacity: "32TB",
          },
          networking: {
            ports: 4,
            type: "Gigabit Ethernet",
            controller: "Broadcom NetXtreme II",
          },
          expansion: {
            pciSlots: 7,
            riserCards: 3,
          },
        }),
        features: JSON.stringify([
          "iDRAC7 Remote Management",
          "Hot-swap drives",
          "Redundant PSU",
          "Tool-free chassis",
        ]),
        formFactor: "2U Rack",
        dimensions: "68.8cm x 43.4cm x 8.7cm",
        weight: "29.5kg",
        powerConsumption: "750W",
        rackUnits: 2,
        msrp: 8999.0,
        currentPrice: 450.0,
        condition: HardwareCondition.USED_GOOD,
        status: HardwareStatus.ACTIVE,
        images: JSON.stringify([
          "https://example.com/dell-r720-front.jpg",
          "https://example.com/dell-r720-rear.jpg",
          "https://example.com/dell-r720-interior.jpg",
        ]),
        datasheets: JSON.stringify([
          "https://example.com/dell-r720-datasheet.pdf",
        ]),
        manuals: JSON.stringify(["https://example.com/dell-r720-manual.pdf"]),
        metaTitle: "Dell PowerEdge R720 - 2U Rack Server for Homelab",
        metaDescription:
          "High-performance Dell PowerEdge R720 server. Dual Xeon E5-2600 support, 768GB RAM capacity, perfect for virtualization.",
      },
    }),

    // HP ProLiant Server
    prisma.hardwareItem.upsert({
      where: { slug: "hp-proliant-dl380-g7" },
      update: {},
      create: {
        name: "HP ProLiant DL380 G7",
        slug: "hp-proliant-dl380-g7",
        model: "DL380 G7",
        partNumber: "DL380G7-001",
        category: HardwareCategory.SERVER,
        subcategory: "2U Rack Server",
        manufacturerId: manufacturers[1].id, // HP
        description:
          "Reliable 2U rack server designed for demanding enterprise applications. Excellent for homelab virtualization.",
        specifications: JSON.stringify({
          cpu: {
            socket: "LGA 1366",
            maxCpus: 2,
            supportedProcessors: ["Intel Xeon 5500", "Intel Xeon 5600"],
          },
          memory: {
            slots: 18,
            maxCapacity: "192GB",
            type: "DDR3 ECC",
            speed: ["1066MHz", "1333MHz"],
          },
          storage: {
            bays: 8,
            type: '2.5" SAS/SATA',
            raidController: "Smart Array P410i",
            maxCapacity: "16TB",
          },
          networking: {
            ports: 4,
            type: "Gigabit Ethernet",
            controller: "HP NC382i",
          },
        }),
        features: JSON.stringify([
          "iLO3 Remote Management",
          "Hot-plug drives",
          "Redundant fans",
          "Energy efficient",
        ]),
        formFactor: "2U Rack",
        dimensions: "70cm x 44.5cm x 8.7cm",
        weight: "28.1kg",
        powerConsumption: "460W",
        rackUnits: 2,
        msrp: 5999.0,
        currentPrice: 280.0,
        condition: HardwareCondition.USED_GOOD,
        status: HardwareStatus.ACTIVE,
        images: JSON.stringify([
          "https://example.com/hp-dl380g7-front.jpg",
          "https://example.com/hp-dl380g7-rear.jpg",
        ]),
        datasheets: JSON.stringify([
          "https://example.com/hp-dl380g7-datasheet.pdf",
        ]),
        manuals: JSON.stringify(["https://example.com/hp-dl380g7-manual.pdf"]),
        metaTitle: "HP ProLiant DL380 G7 - Enterprise 2U Rack Server",
        metaDescription:
          "HP ProLiant DL380 G7 server with dual Xeon support, 192GB RAM capacity, and iLO3 management.",
      },
    }),

    // Cisco Catalyst Switch
    prisma.hardwareItem.upsert({
      where: { slug: "cisco-catalyst-2960x-48ts-l" },
      update: {},
      create: {
        name: "Cisco Catalyst 2960X-48TS-L",
        slug: "cisco-catalyst-2960x-48ts-l",
        model: "2960X-48TS-L",
        partNumber: "WS-C2960X-48TS-L",
        category: HardwareCategory.NETWORKING,
        subcategory: "Managed Switch",
        manufacturerId: manufacturers[2].id, // Cisco
        description:
          "Enterprise-grade 48-port managed switch with advanced security and QoS features. Perfect for homelab networking.",
        specifications: JSON.stringify({
          ports: {
            ethernet: 48,
            sfp: 4,
            speed: "10/100/1000 Mbps",
            uplinks: "1G/10G SFP+",
          },
          switching: {
            capacity: "176 Gbps",
            forwardingRate: "131 Mpps",
            macTable: 8192,
            vlans: 4096,
          },
          features: {
            poe: false,
            stacking: true,
            layer3: false,
            management: "Web, CLI, SNMP",
          },
          security: {
            acl: "IPv4/IPv6",
            dot1x: true,
            dhcpSnooping: true,
            ipSourceGuard: true,
          },
        }),
        features: JSON.stringify([
          "FlexStack-Plus",
          "Energy Efficient Ethernet",
          "IPv6 ready",
          "Advanced QoS",
        ]),
        formFactor: "1U Rack",
        dimensions: "44.45cm x 25.4cm x 4.4cm",
        weight: "3.9kg",
        powerConsumption: "73W",
        rackUnits: 1,
        msrp: 1899.0,
        currentPrice: 320.0,
        condition: HardwareCondition.USED_EXCELLENT,
        status: HardwareStatus.ACTIVE,
        images: JSON.stringify([
          "https://example.com/cisco-2960x-front.jpg",
          "https://example.com/cisco-2960x-rear.jpg",
        ]),
        datasheets: JSON.stringify([
          "https://example.com/cisco-2960x-datasheet.pdf",
        ]),
        manuals: JSON.stringify(["https://example.com/cisco-2960x-manual.pdf"]),
        metaTitle: "Cisco Catalyst 2960X-48TS-L - 48-Port Managed Switch",
        metaDescription:
          "Professional Cisco Catalyst 2960X switch with 48 Gigabit ports, advanced security, and FlexStack-Plus.",
      },
    }),

    // Supermicro Server
    prisma.hardwareItem.upsert({
      where: { slug: "supermicro-6028r-e1cr12n" },
      update: {},
      create: {
        name: "Supermicro SYS-6028R-E1CR12N",
        slug: "supermicro-6028r-e1cr12n",
        model: "SYS-6028R-E1CR12N",
        partNumber: "SYS-6028R-E1CR12N",
        category: HardwareCategory.SERVER,
        subcategory: "2U Rack Server",
        manufacturerId: manufacturers[3].id, // Supermicro
        description:
          "High-performance 2U twin server with exceptional density and efficiency for compute-intensive applications.",
        specifications: JSON.stringify({
          cpu: {
            socket: "LGA 2011-3",
            maxCpus: 4,
            supportedProcessors: [
              "Intel Xeon E5-2600 v3",
              "Intel Xeon E5-2600 v4",
            ],
          },
          memory: {
            slots: 32,
            maxCapacity: "2TB",
            type: "DDR4 ECC",
            speed: ["2133MHz", "2400MHz"],
          },
          storage: {
            bays: 12,
            type: '3.5" SATA/SAS',
            raidController: "Optional",
            maxCapacity: "144TB",
          },
          networking: {
            ports: 4,
            type: "Gigabit Ethernet",
            controller: "Intel I350",
          },
        }),
        features: JSON.stringify([
          "IPMI 2.0",
          "Hot-swap drives",
          "Redundant PSU",
          "Tool-free maintenance",
        ]),
        formFactor: "2U Rack",
        dimensions: "87.3cm x 43.7cm x 8.9cm",
        weight: "35.2kg",
        powerConsumption: "1200W",
        rackUnits: 2,
        msrp: 12999.0,
        currentPrice: 850.0,
        condition: HardwareCondition.REFURBISHED,
        status: HardwareStatus.ACTIVE,
        images: JSON.stringify([
          "https://example.com/supermicro-6028r-front.jpg",
          "https://example.com/supermicro-6028r-rear.jpg",
        ]),
        datasheets: JSON.stringify([
          "https://example.com/supermicro-6028r-datasheet.pdf",
        ]),
        manuals: JSON.stringify([
          "https://example.com/supermicro-6028r-manual.pdf",
        ]),
        metaTitle: "Supermicro SYS-6028R-E1CR12N - Twin 2U Server",
        metaDescription:
          "Supermicro twin server with quad Xeon E5-2600 v3/v4 support, 2TB RAM capacity, and 12 drive bays.",
      },
    }),
  ]);

  // ====================================================================
  // USERS - Development and Testing Users
  // ====================================================================
  console.log("👥 Seeding users...");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@homelab-builder.com" },
      update: {},
      create: {
        email: "admin@homelab-builder.com",
        name: "Platform Administrator",
        username: "admin",
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        bio: "Platform administrator and homelab enthusiast.",
      },
    }),
    prisma.user.upsert({
      where: { email: "moderator@homelab-builder.com" },
      update: {},
      create: {
        email: "moderator@homelab-builder.com",
        name: "Community Moderator",
        username: "moderator",
        role: UserRole.MODERATOR,
        emailVerified: new Date(),
        bio: "Community moderator helping maintain platform quality.",
      },
    }),
    prisma.user.upsert({
      where: { email: "user@homelab-builder.com" },
      update: {},
      create: {
        email: "user@homelab-builder.com",
        name: "Test User",
        username: "testuser",
        role: UserRole.USER,
        emailVerified: new Date(),
        bio: "Homelab enthusiast and hardware collector.",
      },
    }),
  ]);

  // ====================================================================
  // SAMPLE BUILDS - Community Build Examples
  // ====================================================================
  console.log("🏗️ Seeding sample builds...");

  const builds = await Promise.all([
    prisma.build.upsert({
      where: { slug: "enterprise-homelab-setup" },
      update: {},
      create: {
        title: "Enterprise Homelab Setup",
        slug: "enterprise-homelab-setup",
        description:
          "Complete enterprise-grade homelab setup with virtualization, storage, and networking.",
        totalCost: 1050.0,
        purpose: "Homelab",
        difficulty: "Intermediate",
        published: true,
        featured: true,
        authorId: users[0].id, // Admin
        images: JSON.stringify([
          "https://example.com/build-enterprise-homelab-1.jpg",
          "https://example.com/build-enterprise-homelab-2.jpg",
        ]),
        tags: JSON.stringify(["enterprise", "virtualization", "networking", "storage"]),
        viewCount: 245,
        likeCount: 18,
        publishedAt: new Date(),
      },
    }),
    prisma.build.upsert({
      where: { slug: "budget-virtualization-server" },
      update: {},
      create: {
        title: "Budget Virtualization Server",
        slug: "budget-virtualization-server",
        description:
          "Affordable virtualization setup perfect for learning and development.",
        totalCost: 280.0,
        purpose: "Learning",
        difficulty: "Beginner",
        published: true,
        featured: false,
        authorId: users[2].id, // Test User
        images: JSON.stringify(["https://example.com/build-budget-vm-1.jpg"]),
        tags: JSON.stringify(["budget", "virtualization", "beginner", "learning"]),
        viewCount: 89,
        likeCount: 7,
        publishedAt: new Date(),
      },
    }),
  ]);

  // ====================================================================
  // BUILD ITEMS - Hardware Components in Builds
  // ====================================================================
  console.log("🔧 Seeding build items...");

  await Promise.all([
    // Enterprise Homelab Build Items
    prisma.buildItem.create({
      data: {
        buildId: builds[0].id,
        hardwareItemId: hardwareItems[0].id, // Dell R720
        quantity: 1,
        price: 450.0,
        notes:
          "Primary virtualization server with dual Xeon E5-2640 v2 processors.",
      },
    }),
    prisma.buildItem.create({
      data: {
        buildId: builds[0].id,
        hardwareItemId: hardwareItems[2].id, // Cisco 2960X
        quantity: 1,
        price: 320.0,
        notes: "48-port managed switch for network segmentation and VLANs.",
      },
    }),
    prisma.buildItem.create({
      data: {
        buildId: builds[0].id,
        hardwareItemId: hardwareItems[3].id, // Supermicro Server
        quantity: 1,
        price: 850.0,
        notes: "Storage server with 12 drive bays for NAS and backup.",
      },
    }),

    // Budget Virtualization Build Items
    prisma.buildItem.create({
      data: {
        buildId: builds[1].id,
        hardwareItemId: hardwareItems[1].id, // HP DL380 G7
        quantity: 1,
        price: 280.0,
        notes: "Single server setup with adequate performance for learning.",
      },
    }),
  ]);

  // ====================================================================
  // SAMPLE REVIEWS - Hardware Reviews
  // ====================================================================
  console.log("⭐ Seeding sample reviews...");

  await Promise.all([
    prisma.review.create({
      data: {
        hardwareItemId: hardwareItems[0].id, // Dell R720
        reviewerId: users[0].id,
        rating: 5,
        title: "Excellent Enterprise Server for Homelab",
        content:
          "The Dell R720 is a fantastic choice for homelab virtualization. Plenty of RAM capacity, reliable performance, and excellent iDRAC management. Power consumption is reasonable for the performance delivered.",
        purchasePrice: 420.0,
        condition: HardwareCondition.USED_GOOD,
        helpfulCount: 12,
        approved: true,
        approvedBy: users[1].id,
        approvedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        hardwareItemId: hardwareItems[1].id, // HP DL380 G7
        reviewerId: users[2].id,
        rating: 4,
        title: "Great Budget Server Option",
        content:
          "Perfect for getting started with enterprise hardware. iLO3 management is very useful. Only downside is the older DDR3 memory, but for the price point it is excellent value.",
        purchasePrice: 275.0,
        condition: HardwareCondition.USED_GOOD,
        helpfulCount: 8,
        approved: true,
        approvedBy: users[1].id,
        approvedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        hardwareItemId: hardwareItems[2].id, // Cisco 2960X
        reviewerId: users[1].id,
        rating: 5,
        title: "Professional Grade Networking",
        content:
          "This switch provides enterprise-grade features at a great price. VLAN support, QoS, and security features work flawlessly. Web interface is intuitive and CLI is fully featured.",
        purchasePrice: 340.0,
        condition: HardwareCondition.USED_EXCELLENT,
        helpfulCount: 15,
        approved: true,
        approvedBy: users[0].id,
        approvedAt: new Date(),
      },
    }),
  ]);

  // ====================================================================
  // PRICE HISTORY - Sample Price Tracking Data
  // ====================================================================
  console.log("💰 Seeding price history...");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    // Dell R720 Price History
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[0].id,
        price: 480.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example1",
        verified: true,
        verifiedBy: "system",
        timestamp: thirtyDaysAgo,
      },
    }),
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[0].id,
        price: 465.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example2",
        verified: true,
        verifiedBy: "system",
        timestamp: fifteenDaysAgo,
      },
    }),
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[0].id,
        price: 450.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example3",
        verified: true,
        verifiedBy: "system",
        timestamp: sevenDaysAgo,
      },
    }),

    // HP DL380 G7 Price History
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[1].id,
        price: 320.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example4",
        verified: true,
        verifiedBy: "system",
        timestamp: thirtyDaysAgo,
      },
    }),
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[1].id,
        price: 290.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example5",
        verified: true,
        verifiedBy: "system",
        timestamp: fifteenDaysAgo,
      },
    }),
    prisma.priceHistory.create({
      data: {
        hardwareItemId: hardwareItems[1].id,
        price: 280.0,
        condition: HardwareCondition.USED_GOOD,
        source: "ebay",
        sourceUrl: "https://ebay.com/item/example6",
        verified: true,
        verifiedBy: "system",
        timestamp: sevenDaysAgo,
      },
    }),
  ]);

  // ====================================================================
  // ANALYTICS - User Analytics Setup
  // ====================================================================
  console.log("📊 Seeding analytics...");

  await Promise.all([
    prisma.userAnalytics.create({
      data: {
        userId: users[0].id,
        totalViews: 1250,
        totalLikes: 85,
        totalBuilds: 3,
        totalReviews: 5,
        sessionCount: 45,
        avgSessionTime: 25,
        preferredCategories: JSON.stringify(["SERVER", "NETWORKING"]),
        lastLoginAt: new Date(),
      },
    }),
    prisma.userAnalytics.create({
      data: {
        userId: users[1].id,
        totalViews: 650,
        totalLikes: 32,
        totalBuilds: 1,
        totalReviews: 8,
        sessionCount: 28,
        avgSessionTime: 18,
        preferredCategories: JSON.stringify(["NETWORKING", "STORAGE"]),
        lastLoginAt: new Date(),
      },
    }),
    prisma.userAnalytics.create({
      data: {
        userId: users[2].id,
        totalViews: 180,
        totalLikes: 12,
        totalBuilds: 2,
        totalReviews: 3,
        sessionCount: 12,
        avgSessionTime: 15,
        preferredCategories: JSON.stringify(["SERVER"]),
        lastLoginAt: new Date(),
      },
    }),
  ]);

  // ====================================================================
  // SEARCH QUERIES - Sample Search Analytics
  // ====================================================================
  console.log("🔍 Seeding search queries...");

  await Promise.all([
    prisma.searchQuery.create({
      data: {
        query: "dell poweredge r720",
        userId: users[2].id,
        resultCount: 5,
        clickedResult: hardwareItems[0].id,
        responseTime: 45,
      },
    }),
    prisma.searchQuery.create({
      data: {
        query: "cisco catalyst switch",
        userId: users[1].id,
        resultCount: 12,
        clickedResult: hardwareItems[2].id,
        responseTime: 38,
      },
    }),
    prisma.searchQuery.create({
      data: {
        query: "hp proliant server",
        userId: users[0].id,
        resultCount: 8,
        clickedResult: hardwareItems[1].id,
        responseTime: 52,
      },
    }),
  ]);

  // ====================================================================
  // SYSTEM METRICS - Platform Health Data
  // ====================================================================
  console.log("🔧 Seeding system metrics...");

  await Promise.all([
    prisma.systemMetrics.create({
      data: {
        metricName: "daily_active_users",
        metricValue: { count: 125, date: new Date().toISOString() },
      },
    }),
    prisma.systemMetrics.create({
      data: {
        metricName: "total_hardware_items",
        metricValue: {
          count: hardwareItems.length,
          date: new Date().toISOString(),
        },
      },
    }),
    prisma.systemMetrics.create({
      data: {
        metricName: "total_builds",
        metricValue: { count: builds.length, date: new Date().toISOString() },
      },
    }),
    prisma.systemMetrics.create({
      data: {
        metricName: "average_response_time",
        metricValue: { milliseconds: 45, date: new Date().toISOString() },
      },
    }),
  ]);

  console.log("✅ Database seed completed successfully!");
  console.log(`📦 Created ${manufacturers.length} manufacturers`);
  console.log(`🖥️ Created ${hardwareItems.length} hardware items`);
  console.log(`👥 Created ${users.length} users`);
  console.log(`🏗️ Created ${builds.length} builds`);
  console.log("🌱 Seed data ready for development and testing!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
