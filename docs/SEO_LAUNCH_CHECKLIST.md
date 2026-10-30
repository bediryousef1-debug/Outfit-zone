# SEO Launch Checklist

## Vercel production checks

- [ ] In **Vercel → Project → Settings → Deployment Protection**, confirm that Production deployments are not protected from public visitors or search crawlers.
- [ ] In **Vercel → Project → Settings → Environment Variables**, confirm that the production values for `SUPABASE_URL` and `VITE_SUPABASE_URL` point to the currently active Supabase project.
- [ ] Confirm the matching keys belong to that same active project: `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (where used). Never expose the service-role key in client-side variables or public logs.
- [ ] Set `SITE_URL` to the preferred canonical origin when using a custom domain. It defaults to `https://outfitzone-eg.vercel.app`.

## Google Search Console

- [ ] Add `outfitzone-eg.vercel.app` as a **Domain property** in Google Search Console and complete DNS verification.
- [ ] Submit `https://outfitzone-eg.vercel.app/sitemap.xml` under **Indexing → Sitemaps**.
- [ ] Use URL Inspection to request indexing for the home page: `https://outfitzone-eg.vercel.app/`.
- [ ] Request indexing for the three strongest, in-stock product URLs after confirming their exact live slugs.
- [ ] Recheck the Page Indexing and Crawl Stats reports after Google has recrawled the site; indexing is not guaranteed immediately.

## Discovery and domain

- [ ] Add the canonical website link to the Facebook, Instagram, and TikTok business profiles.
- [ ] Consider purchasing a custom domain such as a suitable `.com` or `.com.eg` domain, then add and verify it in the Vercel project.
- [ ] After adding a custom domain, set the production `SITE_URL` environment variable to that domain, redeploy, and update/verify the Search Console Domain property and sitemap submission.
