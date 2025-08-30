# Game Deck

A clean, fast, and flexible web app to collect guides, maps, tools, and resources for your favorite games—organized as interactive cards you can add from templates or create yourself.

## Overview
Game Deck lets you:
- Browse curated game templates and add them to your deck
- Create custom cards with your own links and media
- Search across titles, series, and resource metadata
- Filter by series and adjust visual/behavioral settings
- Keep selections and custom cards saved locally

No build step required—open index.html in a modern browser.

## Features
- Template library with “Add to My Deck”
- Custom card creator (multi-resource support)
- Empty-state tutorial to guide first-time users
- Settings for theme, layout, borders, link styles, animation, and defaults
- Smooth UI with subtle, responsive animations
- LocalStorage persistence for custom cards and chosen templates

## Getting Started
1. Clone or download the repository
2. Open index.html in your browser
3. Use the Templates button to add games or “Add Custom Card” to create your own

## Project Structure
- index.html — markup and modals (Settings, Add Custom Card, Templates & Suggestions)
- styles.css — UI/theme, cards, modals, responsive layout
- script.js — rendering, state, settings, templates, custom cards, interactions
- sites.js — curated companion templates data

## Development Notes
- No bundler; CDN fonts/icons only
- Data persistence via LocalStorage
- Form submissions for suggestions go through Formspree

## Roadmap (Potential)
- Preset saving/loading
- Icon-only link display
- Custom card reordering
- Shareable export/import

## Contributing
Open to suggestions via issues or PRs. Please keep the UI clean and performant.

## License
TBD

