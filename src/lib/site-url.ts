export function getMetadataBaseUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      return new URL("https://nibbo.space");
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("https://nibbo.space");
}
