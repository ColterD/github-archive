// ERROR REPORTING API - Frontend Error Collection
// Collects and processes client-side errors for monitoring
// Updated: 2025-01-09 - Added error reporting endpoint

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/server/logger";
import { z, type ZodError } from "zod";
import { rateLimit } from "$lib/server/rate-limit";
import { classifyError } from "$lib/server/utils/cleanup";

// Validation schema for error reports
const errorReportSchema = z.object({
  errorId: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  stack: z.string().max(5000).optional(),
  url: z.string().url(),
  userAgent: z.string().max(500),
  timestamp: z.string(),
  retryCount: z.number().int().min(0).max(10).default(0),
  // Additional context
  componentStack: z.string().max(2000).optional(),
  props: z.record(z.string(), z.any()).optional(),
  state: z.record(z.string(), z.any()).optional(),
  // Browser info
  viewport: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  // Performance context
  memory: z
    .object({
      usedJSHeapSize: z.number().optional(),
      totalJSHeapSize: z.number().optional(),
    })
    .optional(),
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Rate limiting for error reports
    const clientIP = getClientAddress();
    const rateLimitResult = await rateLimit({
      key: `error-reports:${clientIP}`,
      limit: 20, // 20 error reports per minute
      window: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      logger.warn("Error reporting rate limit exceeded", {
        clientIP,
        remaining: rateLimitResult.remaining,
      });
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const errorReport = errorReportSchema.parse(body);

    // Extract additional context
    const urlObj = new URL(errorReport.url);
    const enrichedError = {
      ...errorReport,
      clientIP,
      receivedAt: new Date().toISOString(),
      pathname: urlObj.pathname,
      search: urlObj.search,
      // Browser detection
      browser: detectBrowser(errorReport.userAgent),
      // Error classification
      errorType: classifyError(errorReport.message, errorReport.stack),
      // Severity assessment
      severity: assessSeverity(errorReport),
    };

    // Log the error with appropriate level based on severity
    if (
      enrichedError.severity === "critical" ||
      enrichedError.severity === "high"
    ) {
      logger.error(
        `[CLIENT ERROR] ${errorReport.message} - Severity: ${enrichedError.severity}`,
      );
    } else {
      logger.warn(
        `[CLIENT ERROR] ${errorReport.message} - Severity: ${enrichedError.severity}`,
      );
    }

    // Check for error patterns that might indicate systemic issues
    await checkErrorPatterns(errorReport, clientIP);

    // Store error for analytics (if needed)
    // await storeErrorForAnalytics(enrichedError);

    return json({
      success: true,
      errorId: errorReport.errorId,
      severity: enrichedError.severity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as ZodError;
      logger.warn("Invalid error report format");
      return json(
        { error: "Invalid request format", details: zodError.issues },
        { status: 400 },
      );
    }

    logger.error(
      `Error report processing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    logger.info(`Error context`, {
      clientIP: getClientAddress(),
    });

    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// Helper function to detect browser from user agent
function detectBrowser(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

// Helper function to assess error severity
function assessSeverity(
  errorReport: z.infer<typeof errorReportSchema>,
): "low" | "medium" | "high" | "critical" {
  const { message, stack, retryCount, url } = errorReport;
  const lowerMessage = message.toLowerCase();

  // Critical errors
  if (
    lowerMessage.includes("security") ||
    lowerMessage.includes("csrf") ||
    lowerMessage.includes("xss") ||
    retryCount > 3
  ) {
    return "critical";
  }

  // High severity errors
  if (
    lowerMessage.includes("payment") ||
    lowerMessage.includes("auth") ||
    lowerMessage.includes("login") ||
    url.includes("/admin") ||
    stack?.includes("Error: ")
  ) {
    return "high";
  }

  // Medium severity errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("timeout") ||
    retryCount > 0
  ) {
    return "medium";
  }

  // Default to low severity
  return "low";
}

// Helper function to check for error patterns
async function checkErrorPatterns(
  errorReport: z.infer<typeof errorReportSchema>,
  clientIP: string,
) {
  // This could be expanded to detect:
  // - Repeated errors from same IP
  // - Spike in specific error types
  // - Errors affecting multiple users
  // - Performance degradation patterns

  const errorType = classifyError(errorReport.message, errorReport.stack);

  // Log pattern detection (simplified)
  logger.info("Error pattern check", {
    errorId: errorReport.errorId,
    errorType,
    clientIP,
    url: errorReport.url,
    retryCount: errorReport.retryCount,
  });
}

// Health check for error reporting service
export const GET: RequestHandler = async () => {
  return json({
    service: "error-reporting",
    status: "operational",
    timestamp: new Date().toISOString(),
    limits: {
      rateLimit: "20 reports per minute",
      maxMessageLength: 1000,
      maxStackLength: 5000,
    },
    supportedErrorTypes: [
      "network",
      "permission",
      "syntax",
      "reference",
      "type",
      "async",
      "resource",
      "unknown",
    ],
  });
};
