# 🌿 Naturia — A World, Naturally Free

An illustrated, non-sexual, English-language naturism atlas and learning site. Original anime-inspired visuals and no photographs of visitors.

## Website
**https://xuthar.github.io/naturia-world/**

## Features
- Interactive SVG world map and 35 country profiles.
- 102 directory records including 101 places and one explicit legal caution; all sourced. Regional and municipal designations must still be verified before visiting.
- Expanded regional explorer, dedicated country pages, and location cards.
- Illustrated signage glossary and legal observatory (legal *context*, not legal advice).
- An integrated Understanding Naturism library with 16 detailed educational chapters, 30 searchable FAQ answers, 37 glossary entries and 16 source-linked myth checks.
- Standalone sun safety and everyday-life resources, incorporating WHO guidance and clear medical/legal caveats.
- Naturism Academy with 10 short lessons and an interactive etiquette quiz.
- Naturia Magazine with eight original, source-linked editorial essays.
- Global association/event directory (does not invent event dates).
- Private, browser-local journey planner with copyable itinerary. No login and no analytics.

## Research
Sources include FENAIT, FPN, FEN, INF-FNI, National Trust, NSW National Parks, NPS, VisitDenmark and local authorities. The source-attributed beach directory and the country guides live together in `data.js`. Newly added pins are approximate localities, **not** beach entry points. Entries tagged traditional must never be interpreted as officially authorised. All editorial entries distinguish source evidence from legal permission and personal experience.

Weekly source-link HTTP checks are defined in `.github/workflows/source-audit.yml`. They produce `content/source-status.json` and do **not** automatically alter legal information. A HTTP error might be an anti-bot measure; manual review is required.

## Hosting
GitHub Pages uses GitHub Actions via `.github/workflows/publish.yml` from branch `main`. The deploy copies website files to `public/`.

## Local preview
Use `python -m http.server 8000` and visit http://localhost:8000. This project runs as a single static website with `index.html`, `styles.css`, `data.js`, `worldmap.js` and `app.js`.

## Privacy and safety
All pages are educational and non-sexual. No photo submissions or user accounts; the itinerary is saved only in the visitor's browser. No live reservation data, no false star ratings, and no certainty claims about every country's laws.

## Editorial corrections

The [public correction form](https://github.com/xuthar/naturia-world/issues/new?template=correction.yml) lets visitors propose source-backed changes. GitHub login is required and submissions are public. No photos of people or private personal data.

All pages and their supplementary guides are implemented through one shared router in `app.js`. There are no separate site versions.

## Private travel journal

The `#/journal` section provides date-stamped illustrated postcards, entirely in local browser storage, with a JSON export button and no personal-data collection or photo uploads.

## Expanded understanding naturism section

Navigate to `#/naturism` for chapters on history and FKK, meaning, body neutrality, consent, privacy, everyday routines, clubs, saunas, beaches, outdoor activities, accessibility and environmental responsibility. Individual lessons use `#/learn/<slug>`. Browse `#/faq`, `#/glossary`, `#/myths`, `#/wellbeing` and `#/lifestyle` for searchable reference pages. All content is part of the same Naturia site and single route system.
