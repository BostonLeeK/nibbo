export function encodeBlobPath(pathname: string): string {
  return Buffer.from(pathname, "utf8").toString("base64url");
}

export function decodeBlobPath(token: string): string | null {
  try {
    const pathname = Buffer.from(token, "base64url").toString("utf8");
    if (!pathname || pathname.includes("..") || pathname.startsWith("/") || pathname.includes("\\")) {
      return null;
    }
    return pathname;
  } catch {
    return null;
  }
}
