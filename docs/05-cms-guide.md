# 05 — CMS guide (Keystatic)

The CMS is where you change the **words and marketing content** of the site without touching code. Products, prices, stock and orders are **not** here — those are in the admin panel ([06](06-admin-guide.md)).

## Opening the CMS

1. Sign in at `/login` with a staff or admin account.
2. Go to `/keystatic` (or click **Content (CMS)** in the admin sidebar).

Visitors who aren't staff are sent to the sign-in page.

## How saving works

| Where you edit | What happens when you click Save |
| --- | --- |
| **Your computer** (`npm run dev`, storage `local`) | The file in `content/` is updated immediately. Commit and push it to GitHub to publish it. |
| **Live site** (Vercel) | Only works after switching to **GitHub mode** (below). Saving creates a commit on GitHub and Vercel redeploys in ~2 minutes. |

> Right now the live site uses local mode, so edit content on your computer, then `git add content && git commit -m "…" && git push`. Vercel redeploys automatically.

### Switching the live site to GitHub mode (edit online)

1. In Vercel, set `NEXT_PUBLIC_KEYSTATIC_STORAGE` = `github` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` = `pratik-walunj/RenewByte` (both type **Config**). Redeploy.
2. Visit `https://renew-byte.vercel.app/keystatic`. Keystatic guides you through creating a GitHub App and shows four values.
3. Add them in Vercel: `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` (Secret type) and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (Config type). Redeploy.

## What you can edit

The left menu of the CMS is grouped like this:

### Site & layout

| Item | Controls |
| --- | --- |
| **Site settings** | Business name, legal name, tagline, logo, **phone**, **WhatsApp number** (digits only, with 91, e.g. `918576000084`), default WhatsApp message, **email**, GSTIN, **address**, business hours, Google Maps embed link, social links, analytics IDs, default SEO title/description/share image |
| **Announcement bar** | The thin dark bar at the very top — on/off and the messages (with optional links). On phones the first 3 rotate |
| **Header navigation** | Main menu links (e.g. Laptops, MacBooks, Deals) and secondary links. Tick "Highlight" to show a link in red |
| **Footer** | About text, the 4 link columns, payment note, bottom legal note |

### Homepage

| Item | Controls |
| --- | --- |
| **Homepage** | Hero headline (each line on its own line), supporting text, the two buttons, hero image, the "Every laptop, before it ships" checklist, the 5 trust features under the hero, all section titles/subtitles, "Why buy refurbished?" points, newsletter text |
| **Promotional banners** | Wide banners. Choose placement (homepage middle, homepage bottom, deals page, all-laptops page), style (dark / light / blue), active on/off and optional start/end dates |
| **Testimonials** | Customer quotes. Keep **Sample content** ticked for placeholder quotes (they show a "Sample" badge). Only publish real, verifiable feedback |

### Trust content

| Item | Controls |
| --- | --- |
| **Condition grades** | The definition of A+, A, B and C — used in the "What does this grade mean?" pop-up, product pages and `/condition-grades` |
| **How we refurbish** | The 9 process steps and the trust commitments on `/how-we-refurbish` and the homepage |
| **FAQs** | Question, answer, category, and whether to show it on the homepage and/or product pages |

### Pages

| Item | Controls |
| --- | --- |
| **Static pages** | `about`, `warranty`, `returns`, `shipping`, `privacy-policy`, `terms`, `careers`. The slug is the URL (`/warranty`). Headings (H2) automatically build the "On this page" list |
| **SEO landing pages** | Extra text for brand, category and price pages: H1 heading, intro, key points, FAQs and a buying-guide section. Types: *All laptops* (`/laptops`), *Brand* (`/brand/dell`), *Category* (`/category/gaming-laptops`), *Listing* (`/laptops/under-30000` — set min/max price) |

### Blog

| Field | Notes |
| --- | --- |
| Title | Also creates the URL (`/blog/your-title`) |
| Excerpt | Shown on cards and in search results if no SEO description |
| Category | Buying guide, refurbished guide, comparison, technology, maintenance, tips |
| Cover image + alt text | 1200 × 630 works best |
| Published / updated date, reading time | Shown on the article |
| Feature on homepage | Featured posts appear first in "Buying guides" |
| SEO | Title (50–60 characters) and description (140–160) |
| Content | Rich text: headings, lists, links, tables, images |

## Writing tips

- **Links:** use relative links for your own pages (`/laptops/under-30000`), full links for other sites.
- **Headings:** start at H2 in pages and posts (the page title is already the H1).
- **Images:** always fill in alt text — it describes the image for screen readers and Google.
- **Claims:** only write what the business actually does (warranty length, return window, delivery times). The policy pages currently contain placeholder terms marked "Template policy — review with your legal advisor before launch".

## Where the files live

| CMS item | File |
| --- | --- |
| Site settings | `content/settings/site.yaml` |
| Announcement bar | `content/settings/announcement.yaml` |
| Navigation / Footer | `content/settings/navigation.yaml`, `content/settings/footer.yaml` |
| Homepage | `content/home.yaml` |
| Condition grades / Refurbish process | `content/settings/condition-grades.yaml`, `content/settings/refurbish-process.yaml` |
| Blog / Pages / Landing pages | `content/blog/*.mdoc`, `content/pages/*.mdoc`, `content/landing/*.mdoc` |
| FAQs / Testimonials / Banners | `content/faqs/*.yaml`, `content/testimonials/*.yaml`, `content/banners/*.yaml` |

Developers can edit these files directly; the CMS reads the same files. The content model itself is defined in `keystatic.config.ts`.
