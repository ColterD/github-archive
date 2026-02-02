-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'VERIFIED', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "HardwareCategory" AS ENUM ('SERVER', 'STORAGE', 'NETWORKING', 'VIRTUALIZATION', 'COMPONENTS', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "HardwareCondition" AS ENUM ('NEW', 'REFURBISHED', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "HardwareStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'PENDING_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('HARDWARE_ITEM', 'REVIEW', 'BUILD', 'USER_PROFILE');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE_CONTENT', 'INCORRECT_INFORMATION', 'COPYRIGHT_VIOLATION', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "location" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerified" TIMESTAMP(3),
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "contributionPoints" INTEGER NOT NULL DEFAULT 0,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "partNumber" TEXT,
    "sku" TEXT,
    "category" "HardwareCategory" NOT NULL,
    "subcategory" TEXT,
    "manufacturerId" TEXT NOT NULL,
    "description" TEXT,
    "specifications" JSONB,
    "features" TEXT[],
    "formFactor" TEXT,
    "dimensions" TEXT,
    "weight" TEXT,
    "powerConsumption" TEXT,
    "rackUnits" INTEGER,
    "msrp" DECIMAL(10,2),
    "currentPrice" DECIMAL(10,2),
    "condition" "HardwareCondition" NOT NULL DEFAULT 'USED_GOOD',
    "status" "HardwareStatus" NOT NULL DEFAULT 'ACTIVE',
    "images" TEXT[],
    "datasheets" TEXT[],
    "manuals" TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "searchVector" tsvector,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_compatibility" (
    "id" TEXT NOT NULL,
    "fromHardwareId" TEXT NOT NULL,
    "toHardwareId" TEXT NOT NULL,
    "compatibilityType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hardware_compatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "hardwareItemId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "condition" "HardwareCondition" NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "region" TEXT NOT NULL DEFAULT 'US',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_reports" (
    "id" TEXT NOT NULL,
    "hardwareItemId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "condition" "HardwareCondition" NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "totalCost" DECIMAL(10,2),
    "purpose" TEXT,
    "difficulty" TEXT,
    "images" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_items" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "hardwareItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "hardwareItemId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "purchasePrice" DECIMAL(10,2),
    "condition" "HardwareCondition",
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hardwareItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalBuilds" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "avgSessionTime" INTEGER NOT NULL DEFAULT 0,
    "preferredCategories" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "resultCount" INTEGER NOT NULL,
    "clickedResult" TEXT,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_reputationScore_idx" ON "users"("reputationScore");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_name_key" ON "manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_slug_key" ON "manufacturers"("slug");

-- CreateIndex
CREATE INDEX "manufacturers_slug_idx" ON "manufacturers"("slug");

-- CreateIndex
CREATE INDEX "manufacturers_name_idx" ON "manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_items_slug_key" ON "hardware_items"("slug");

-- CreateIndex
CREATE INDEX "hardware_items_slug_idx" ON "hardware_items"("slug");

-- CreateIndex
CREATE INDEX "hardware_items_category_idx" ON "hardware_items"("category");

-- CreateIndex
CREATE INDEX "hardware_items_manufacturerId_idx" ON "hardware_items"("manufacturerId");

-- CreateIndex
CREATE INDEX "hardware_items_status_idx" ON "hardware_items"("status");

-- CreateIndex
CREATE INDEX "hardware_items_condition_idx" ON "hardware_items"("condition");

-- CreateIndex
CREATE INDEX "hardware_items_currentPrice_idx" ON "hardware_items"("currentPrice");

-- CreateIndex
CREATE INDEX "hardware_items_createdAt_idx" ON "hardware_items"("createdAt");

-- CreateIndex
CREATE INDEX "hardware_items_viewCount_idx" ON "hardware_items"("viewCount");

-- CreateIndex
CREATE INDEX "hardware_items_favoriteCount_idx" ON "hardware_items"("favoriteCount");

-- CreateIndex
CREATE INDEX "hardware_items_searchVector_idx" ON "hardware_items" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "hardware_items_category_status_createdAt_idx" ON "hardware_items"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "hardware_items_manufacturerId_category_status_idx" ON "hardware_items"("manufacturerId", "category", "status");

-- CreateIndex
CREATE INDEX "hardware_items_status_condition_currentPrice_idx" ON "hardware_items"("status", "condition", "currentPrice");

-- CreateIndex
CREATE INDEX "hardware_items_category_currentPrice_createdAt_idx" ON "hardware_items"("category", "currentPrice", "createdAt");

-- CreateIndex
CREATE INDEX "hardware_items_manufacturerId_status_createdAt_idx" ON "hardware_items"("manufacturerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "hardware_items_status_viewCount_createdAt_idx" ON "hardware_items"("status", "viewCount", "createdAt");

-- CreateIndex
CREATE INDEX "hardware_items_category_favoriteCount_createdAt_idx" ON "hardware_items"("category", "favoriteCount", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_compatibility_fromHardwareId_toHardwareId_compatibilit_key" ON "hardware_compatibility"("fromHardwareId", "toHardwareId", "compatibilityType");

-- CreateIndex
CREATE INDEX "hardware_compatibility_fromHardwareId_idx" ON "hardware_compatibility"("fromHardwareId");

-- CreateIndex
CREATE INDEX "hardware_compatibility_toHardwareId_idx" ON "hardware_compatibility"("toHardwareId");

-- CreateIndex
CREATE INDEX "price_history_hardwareItemId_idx" ON "price_history"("hardwareItemId");

-- CreateIndex
CREATE INDEX "price_history_timestamp_idx" ON "price_history"("timestamp");

-- CreateIndex
CREATE INDEX "price_history_source_idx" ON "price_history"("source");

-- CreateIndex
CREATE INDEX "price_history_condition_idx" ON "price_history"("condition");

-- CreateIndex
CREATE INDEX "price_reports_hardwareItemId_idx" ON "price_reports"("hardwareItemId");

-- CreateIndex
CREATE INDEX "price_reports_reporterId_idx" ON "price_reports"("reporterId");

-- CreateIndex
CREATE INDEX "price_reports_createdAt_idx" ON "price_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "builds_slug_key" ON "builds"("slug");

-- CreateIndex
CREATE INDEX "builds_slug_idx" ON "builds"("slug");

-- CreateIndex
CREATE INDEX "builds_authorId_idx" ON "builds"("authorId");

-- CreateIndex
CREATE INDEX "builds_published_idx" ON "builds"("published");

-- CreateIndex
CREATE INDEX "builds_featured_idx" ON "builds"("featured");

-- CreateIndex
CREATE INDEX "builds_createdAt_idx" ON "builds"("createdAt");

-- CreateIndex
CREATE INDEX "builds_viewCount_idx" ON "builds"("viewCount");

-- CreateIndex
CREATE INDEX "build_items_buildId_idx" ON "build_items"("buildId");

-- CreateIndex
CREATE INDEX "build_items_hardwareItemId_idx" ON "build_items"("hardwareItemId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_hardwareItemId_reviewerId_key" ON "reviews"("hardwareItemId", "reviewerId");

-- CreateIndex
CREATE INDEX "reviews_hardwareItemId_idx" ON "reviews"("hardwareItemId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_approved_idx" ON "reviews"("approved");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_hardwareItemId_key" ON "favorites"("userId", "hardwareItemId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_hardwareItemId_idx" ON "favorites"("hardwareItemId");

-- CreateIndex
CREATE INDEX "content_reports_contentType_contentId_idx" ON "content_reports"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "content_reports_reporterId_idx" ON "content_reports"("reporterId");

-- CreateIndex
CREATE INDEX "content_reports_reportedUserId_idx" ON "content_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_createdAt_idx" ON "content_reports"("createdAt");

-- CreateIndex
CREATE INDEX "moderation_actions_moderatorId_idx" ON "moderation_actions"("moderatorId");

-- CreateIndex
CREATE INDEX "moderation_actions_contentType_contentId_idx" ON "moderation_actions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "moderation_actions_createdAt_idx" ON "moderation_actions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_userId_key" ON "user_analytics"("userId");

-- CreateIndex
CREATE INDEX "system_metrics_metricName_idx" ON "system_metrics"("metricName");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "search_queries_query_idx" ON "search_queries"("query");

-- CreateIndex
CREATE INDEX "search_queries_userId_idx" ON "search_queries"("userId");

-- CreateIndex
CREATE INDEX "search_queries_createdAt_idx" ON "search_queries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_usageCount_idx" ON "tags"("usageCount");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_compatibility" ADD CONSTRAINT "hardware_compatibility_fromHardwareId_fkey" FOREIGN KEY ("fromHardwareId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_compatibility" ADD CONSTRAINT "hardware_compatibility_toHardwareId_fkey" FOREIGN KEY ("toHardwareId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_items" ADD CONSTRAINT "build_items_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_items" ADD CONSTRAINT "build_items_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;