import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nibbo",
    short_name: "Nibbo",
    description: "Затишна домашня CRM система для всієї родини",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#f43f5e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
