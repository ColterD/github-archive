// CSP VIOLATION REPORTING API - Security Monitoring
// Handles Content Security Policy violation reports
// Updated: 2025-01-09 - Added CSP violation reporting endpoint

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/server/logger";
import { handleCSPViolation } from "$lib/server/security-headers";
import { rateLimit } from "$lib/server/rate-limit";
import { detectAttackPattern } from "$lib/server/utils/cleanup";
import { z } from "zod";

// CSP Report interfaces
interface CSPReport {
  "violated-directive"?: string;
  "blocked-uri"?: string;
  "source-file"?: string;
  "script-sample"?: string;
  "line-number"?: number;
  "column-number"?: number;
  "original-policy"?: string;
  disposition?: string;
  "effective-directive"?: string;
}

// CSP violation report schema
const cspReportSchema = z.object({
  "csp-report": z.object({
    "blocked-uri": z.string().optional(),
    "violated-directive": z.string().optional(),
    "original-policy": z.string().optional(),
    "document-uri": z.string().optional(),
    "source-file": z.string().optional(),
    "line-number": z.number().optional(),
    "column-number": z.number().optional(),
    "status-code": z.number().optional(),
    "script-sample": z.string().optional(),
  }),
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Rate limiting for CSP reports
    const clientIP = getClientAddress();
    const rateLimitResult = await rateLimit({
      key: `csp-reports:${clientIP}`,
      limit: 50, // 50 reports per minute
      window: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      logger.warn("CSP report rate limit exceeded", {
        clientIP,
        remaining: rateLimitResult.remaining,
      });
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Parse and validate CSP report
    const body = await request.json();
    const report = cspReportSchema.parse(body);
    const cspReport = report["csp-report"];

    // Enrich report with additional context
    const enrichedReport = {
      ...cspReport,
      clientIP,
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
      referer: request.headers.get("referer"),
    };

    // Handle the CSP violation
    handleCSPViolation(enrichedReport);

    // Classify violation severity
    const severity = classifyViolationSeverity(cspReport);

    // Log with appropriate level based on severity
    const logLevel =
      severity === "critical" ? "error" : severity === "high" ? "warn" : "info";

    logger[logLevel]("CSP violation reported");
    logger.info("CSP violation details", {
      ...enrichedReport,
      severity,
      classification: classifyViolationType(cspReport),
    });

    // Check for attack patterns
    const attackPattern = detectAttackPattern(
      cspReport["blocked-uri"] || "",
      cspReport["script-sample"] || "",
      cspReport["violated-directive"] || ""
    );
    if (attackPattern) {
      logger.error("Potential security attack detected via CSP");
      logger.info("Attack pattern details", {
        ...enrichedReport,
        attackPattern,
        severity: "critical",
      });
    }

    return json({ success: true }, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid CSP report format");
      logger.info("CSP report validation error", {
        errors: error.issues,
        clientIP: getClientAddress(),
      });
      return json({ error: "Invalid report format" }, { status: 400 });
    }

    logger.error("CSP report processing failed", error as Error);
    logger.info("Client IP", { clientIP: getClientAddress() });

    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// Classify violation severity
function classifyViolationSeverity(
  report: CSPReport,
): "low" | "medium" | "high" | "critical" {
  const { "violated-directive": directive, "blocked-uri": uri } = report;

  // Critical violations
  if (directive?.includes("script-src") && uri?.includes("javascript:")) {
    return "critical"; // Potential XSS
  }

  if (directive?.includes("object-src") || directive?.includes("base-uri")) {
    return "critical"; // High-risk directives
  }

  // High severity violations
  if (directive?.includes("script-src") || directive?.includes("style-src")) {
    return "high"; // Code injection attempts
  }

  // Medium severity violations
  if (directive?.includes("img-src") || directive?.includes("font-src")) {
    return "medium"; // Resource loading issues
  }

  // Default to low
  return "low";
}

// Classify violation type
function classifyViolationType(report: CSPReport): string {
  const {
    "violated-directive": directive,
    "blocked-uri": uri,
    "source-file": sourceFile,
  } = report;

  if (directive?.includes("script-src")) {
    if (uri?.includes("data:") || uri?.includes("javascript:")) {
      return "inline-script-injection";
    }
    if (uri?.includes("eval") || sourceFile?.includes("eval")) {
      return "eval-usage";
    }
    return "script-loading";
  }

  if (directive?.includes("style-src")) {
    if (uri?.includes("data:")) {
      return "inline-style-injection";
    }
    return "style-loading";
  }

  if (directive?.includes("img-src")) {
    return "image-loading";
  }

  if (directive?.includes("connect-src")) {
    return "xhr-fetch-violation";
  }

  if (directive?.includes("frame-src")) {
    return "iframe-violation";
  }

  return "unknown";
}

// Health check endpoint
export const GET: RequestHandler = async () => {
  return json({
    service: "csp-reporting",
    status: "operational",
    timestamp: new Date().toISOString(),
    limits: {
      rateLimit: "50 reports per minute",
    },
    supportedReportTypes: ["csp-violation"],
    severityLevels: ["low", "medium", "high", "critical"],
    detectedAttackPatterns: [
      "xss-attempt",
      "data-exfiltration",
      "clickjacking-attempt",
    ],
  });
};
