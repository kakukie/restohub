import { NextRequest } from "next/server";

function getBaseOrigin(request?: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBase) {
    try {
      return new URL(envBase).origin;
    } catch {
      // Ignore invalid env value and fall back to request origin.
    }
  }
  return request?.nextUrl?.origin || "https://meenuin.biz.id";
}

function normalizeUploadPath(pathname: string): string {
  const cleanPath = pathname.split("?")[0];
  if (cleanPath.startsWith("/api/uploads/")) return cleanPath;
  if (cleanPath.startsWith("/uploads/")) {
    return `/api/uploads/${cleanPath.replace(/^\/uploads\//, "")}`;
  }
  return cleanPath;
}

export function normalizeMediaUrl(rawUrl?: string | null, request?: NextRequest): string | null | undefined {
  if (!rawUrl) return rawUrl;

  const value = rawUrl.trim();
  if (!value) return value;

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("file:")
  ) {
    return value;
  }

  const baseOrigin = getBaseOrigin(request);

  if (value.startsWith("/")) {
    return `${baseOrigin}${normalizeUploadPath(value)}`;
  }

  if (!value.includes("://")) {
    if (value.startsWith("uploads/")) {
      return `${baseOrigin}/api/uploads/${value.replace(/^uploads\//, "")}`;
    }
    return `${baseOrigin}/${value.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(value);
    const isLocalHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0";

    if (isLocalHost) {
      return `${baseOrigin}${normalizeUploadPath(url.pathname)}${url.search}`;
    }

    // Enforce HTTPS for known production hostname references.
    if (url.protocol === "http:" && url.hostname === "meenuin.biz.id") {
      url.protocol = "https:";
    }

    return `${url.origin}${normalizeUploadPath(url.pathname)}${url.search}`;
  } catch {
    return `${baseOrigin}/${value.replace(/^\/+/, "")}`;
  }
}
