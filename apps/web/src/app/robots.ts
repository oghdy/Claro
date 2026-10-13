import type { MetadataRoute } from "next";

// 아직 공개하는 서비스가 아니다 — 어느 로봇도 긁어 가지 않게 한다 (D36 · D37). 공개할 때 다시 본다
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
