import type { IncomingHttpHeaders } from "http";

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export type RequestGeo = {
  country: string;
  region: string;
  city: string;
};

function firstHeader(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Decode a proxy geo header and strip control characters. Empty when absent. */
export function cleanHeaderValue(raw: string | string[] | undefined, max = 64): string {
  const trimmed = firstHeader(raw).trim();
  if (!trimmed) return "";
  let value = trimmed;
  try {
    value = decodeURIComponent(trimmed.replace(/\+/g, " "));
  } catch {
    value = trimmed;
  }
  value = value.replace(CONTROL_CHARS, "").trim();
  if (!value) return "";
  return value.slice(0, max);
}

/** Snapshot Cloudflare geo headers. Call this when the request arrives. */
export function geoFromHeaders(headers: IncomingHttpHeaders): RequestGeo {
  return {
    country: cleanHeaderValue(headers["cf-ipcountry"]),
    region: cleanHeaderValue(headers["cf-region"]),
    city: cleanHeaderValue(headers["cf-ipcity"]),
  };
}

export function clipText(raw: string | string[] | undefined, max: number): string {
  const value = firstHeader(raw).replace(CONTROL_CHARS, "").trim();
  if (!value) return "";
  return value.slice(0, max);
}
