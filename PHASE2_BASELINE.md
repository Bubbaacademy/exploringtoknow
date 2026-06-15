# Phase 2 — Pre-change baseline & content fingerprint

Captured 2026-06-15 from production (`etk-prod`, db `exploringtoknow`) before any Phase 2 change.
Purpose: prove that the Phase 2 UI work did NOT rewrite article text, affiliate URLs,
product data, media, or editorial state. Re-run the same query after deploy and diff.

## Git baseline
- Local + prod HEAD: `181e953` (Phase 1).
- Feature branch: `phase2-nav-search-article`.
- Local rollback tag: `pre-phase2-navsearch` → `181e953`.

## Published article count: 3 (ids 3, 4, 7) — all type `problem_solution`

## Content fingerprint (all articles)

| id | slug | estatus | title_md5 | markdown_md5 | md_len | prose | inline | callout | prose_md5 | hero | cat | prod |
|----|------|---------|-----------|--------------|--------|-------|--------|---------|-----------|------|-----|------|
| 1 | the-best-etk-production-mock-smoke-test-options | draft | b674297cb1aa72a8e73a4a33755c6dbc | b5bb206d92a74c5b777fb08f42352ee9 | 512 | 0 | 0 | 0 | (none) | – | – | 1 |
| 2 | are-led-indicator-lights-keeping-you-awake-a-clean-simple-fix | draft | 3fad591608c50f78c23ecc698945fafa | 5fc77fbf9e870ce3d4d7311b4270bd52 | 9321 | 0 | 0 | 0 | (none) | – | – | 2 |
| 3 | bright-leds-ruining-your-sleep-a-simple-clean-fix | published | ce98db82f085f8941aecb6379fa1eb02 | 0600568958ac17d23126c5997534a247 | 8774 | 8 | 4 | 1 | f00bc3b791604647fe52d7056d3e4142 | 8 | 1 | 2 |
| 4 | zzz-test-flancci-led-dimming-stickers | published | 4881c76e4a5ccde195649343d527c08d | 3230871db05a98bced212a2c6273f195 | 8952 | 7 | 4 | 1 | 9d8f42feb55573a9d0e51860052abb4e | 11 | 1 | 2 |
| 7 | tired-of-bra-lines-and-show-through-what-silicone-nipple-pasties-actually-do | published | a9ebdeeb1a90e111d211137b3284e90f | 9fb74290c4fdaaca247c29d2d09a1f96 | 7957 | 0 | 4 | 0 | (none) | 15 | 7 | 5 |

Notes:
- Article 7 has 4 inline-image blocks but **0 prose blocks**, so its stored markdown
  body (7957 chars) is currently NOT rendered on the live site (body shows images only).
  Phase 2 body rework surfaces this stored markdown without altering it (md5 unchanged).
- Affiliate URLs / product data not captured here as text (must not change); affiliate
  rendering verified separately via live HTML (rel="sponsored nofollow noopener").

## Active categories: 23 (sorted by name) — drive the Topics menu from this real data.
```
appliances, arts-crafts-hobbies, automotive, baby-kids, beauty-personal-care,
books-media-entertainment, clothing-shoes-accessories, food-grocery, gifts-seasonal,
health-fitness, home-kitchen, industrial-professional, jewelry-watches,
office-school-business, other-not-sure, outdoors-garden-patio, pet-supplies,
sleep-wellness, sports-recreation, tech-electronics, tools-home-improvement,
toys-games, travel-luggage
```
