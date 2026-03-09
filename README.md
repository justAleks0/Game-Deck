# Game Deck

**Your games and favorite links, in one deck.**

Browse your games, jump to character guides and tier lists, and keep shortcuts in one place—on your phone or desktop.

---

## What it does

- **Featured games carousel** – Swipe through game cards (Genshin, HSR, ZZZ, Wuthering Waves, Nikke, and more). Each card has tools (Characters, Weapons, Tier List) that open the right pages.
- **Custom shortcuts** – Add quick links (e.g. character guides, Prydwen) as cards so you can open them in one tap.
- **Marketplace** – Browse and import cards from the repo’s `Cards/Games` and `Cards/Shortcuts` JSON files.
- **Profiles** – Export and import your setup as a share code or QR so you can sync or share it.
- **Reorder & edit** – Arrange games and shortcuts, edit cards, and add new ones from the marketplace or manually.
- **Card Maker** – A dedicated button in the header opens the [Card Maker](https://justaleks0.github.io/Game-Deck-Card-Maker/) so you can build and submit your own custom cards.

---

## Try it out

**[https://justaleks0.github.io/Game-Deck/](https://justaleks0.github.io/Game-Deck/)**

Runs in the browser, no install. Works best on mobile but fine on desktop too.

---

## Tech

Vanilla HTML, CSS, and JavaScript. No build step. Uses `localStorage` for your custom games, shortcuts, and profiles, and the GitHub API to fetch marketplace cards.

---

## Card Maker

Create and submit your own custom cards with the [Card Maker](https://justaleks0.github.io/Game-Deck-Card-Maker/)—reachable via the **Card Maker** button in the Game Deck header.

---

## Contributing

Cards live in `Cards/Games/` and `Cards/Shortcuts/` as JSON. New files in those folders show up in the marketplace.

**Games:** `kind`, `name`, `image`, `studio`, `year`, `tools` (array of `{label, href}`)

**Shortcuts:** `kind`, `name`, `image`, `link`

---

## License

See [LICENSE](LICENSE) for details.
