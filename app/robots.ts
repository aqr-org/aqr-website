import { MetadataRoute } from 'next';

const defaultUrl = process.env.SITE_URL
  ? process.env.SITE_URL
  : "https://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/protected/',
          '/error/',
          '/debug-rls',
          '/superadmin/',
          '/site-settings/',
          '/members-only-content',
          '/_next/',
        ],
      },
    ],
    sitemap: `${defaultUrl}/sitemap.xml`,
  };
}

