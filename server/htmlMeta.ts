import type { Request, Response } from "express";
import { geoFromHeaders } from "./requestGeo";

/** Short private cache so geo meta tags are not reused across visitors. */
export const HTML_CACHE_CONTROL = "private, no-cache, max-age=0, must-revalidate";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceMeta(html: string, name: string, content: string): string {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  if (html.includes("</head>")) {
    return html.replace("</head>", `    ${tag}\n  </head>`);
  }
  return html;
}

/** Inject cf-country and cf-region meta tags from headers captured for this response. */
export function injectGeoMeta(template: string, geo: { country: string; region: string }): string {
  const withCountry = replaceMeta(template, "cf-country", geo.country);
  return replaceMeta(withCountry, "cf-region", geo.region);
}

export function sendIndexHtml(req: Request, res: Response, template: string): void {
  const geo = geoFromHeaders(req.headers);
  const html = injectGeoMeta(template, geo);
  res.status(200);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", HTML_CACHE_CONTROL);
  res.setHeader("Vary", "CF-IPCountry, cf-region");
  res.send(html);
}
