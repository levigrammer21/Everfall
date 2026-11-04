# Everfall build report

**Build 0.9.0 · November 4, 2026**

This build is playable and packaged for GitHub Pages. It covers the principal progression loop and leaves several production requirements open. The sections below distinguish shipped behavior from coverage gaps.

## Shipped systems

| Area | In this build |
| --- | --- |
| Adventure | Fixed-step automatic combat, five-hero formations, timed skills and passives, summons, elemental effects, knockback, party AI, three-wave stages, ten biomes, boss stages, and Push/Farm fallback |
| Content | 50 selectable heroes, 250 named engine-connected hero skills, 30 equipable pets, 100 base enemy definitions, 30 hero bonds, and 150 tiered achievements with claimable rewards and titles |
| Collection | Five starter heroes, earned crystals, one and ten summons, rarity disclosure, independent pity, duplicate essence, 10-star hero ascension, three egg tiers, five-star pet ascension, and pet transfers |
| Equipment | Ten slots, 100 bases, 150 affix definitions, 30 named uniques with triggered effects, ten sets, class and two-hand constraints, sockets, gems, enchants, comparison, locks, loadouts, and bulk and automatic selling |
| Dungeons and guild | Four dungeon templates with 20 tiers, camp and retreat, eight hero work assignments, a Pet Sanctuary, research, and offline work |
| Reporting | Encounter history, per-hero damage, named pet contributions, attack links, healing and mitigation, status uptime, enemy sources, two-encounter comparison, farming rates, a base-monster encyclopedia, and rare-encounter tracking |
| Saves | Local autosave, JSON export/import, account-specific Firestore documents, Google and email sign-in code, save migration defaults, revision checks, and first-load offline cache |
| Presentation | Phaser scene, an original illustrated forest backdrop, generated pixel-art sprite atlas and biome layers, elemental particles, adjustable shake and particle density, and synthesized sound effects and background music |

## Verified

- Production compilation and bundle generation with TypeScript and Vite.
- Thirteen automated test cases cover content counts, deterministic combat, all registered hero and pet ability entry points, formulas, leveling caps, pity, collection, essence, ascension, loot, equipment protection, assignments, dungeon state, achievement claims, migration, and offline reward accounting.
- Chromium with mobile emulation loaded the built game at a repository-style subpath and exercised early adventure, pet hatching and assignment, hero search, summoning, inventory, combat stats, dungeon save and resume, and offline reopening. Portrait and landscape layouts were visually inspected. The battlefield occupied 294 of 390 viewport pixels in the landscape test (75.4%). The same test logged 19 additional wins in one foreground minute with the network disabled and reported zero browser errors or failed local asset requests.
- One seeded progression run simulated one hour, one day, one week, one month, and three months. The policy reused the starting party, assigned companions, invested in equipment and masteries, and periodically pushed again. It spent crystals and hatched eggs. It did not spend dungeon keys or model a player's enchanting purchases.

| Elapsed | Highest stage cleared | Active hero level | Heroes collected | Pets collected |
| --- | ---: | ---: | ---: | ---: |
| One hour | 9 | 11 | 12 | 1 |
| One day | 23 | 39 | 21 | 3 |
| One week | 147 | 146 | 48 | 27 |
| One month | 564 | 326 | 50 | 30 |
| Three months | 1,218 | 449 | 50 | 30 |

## Open production requirements

- **Art and animation.** The sprite atlas uses shared pixel-art silhouette families with color and design variants. Movement, hits, attacks, specials, entrances, and deaths combine procedural transforms with effects. The build still needs the full set of individually authored sprites and action frames for all heroes, pets, enemies, and bosses, plus bespoke dungeon environments and equivalent art direction across all ten biomes.
- **Ability depth.** The 250 named hero abilities run through reusable effect families. Some signature mechanics have custom rules. The full handoff calls for bespoke behavior and animation across the roster, individual mastery trees, and additional hero-specific ascension changes. Pets have their own effect timers and power scaling through their owner. Further pet-specific behavior and encounter design remain open.
- **Persistence and offline fidelity.** A dungeon saves its completed waves and camp state. A wave interrupted mid-fight starts again. Extended offline time samples proven combat, then aggregates rewards and retains a bounded number of actual equipment rolls. Overflow rolls become gold. Rare encounters can occur during the explicitly simulated portion. Offline mode does not enumerate every long-absence encounter or gear roll.
- **Balance and performance.** The seeded run still accumulated substantial gold and keys and filled both collections by one month. Economy sinks, alternate builds, the full range of hero and pet performance, and longer device soak tests remain unverified. The stage counter has a numerical guard at one billion. The 60 FPS target has not been verified on a physical phone.
- **Live backend.** The client points to the supplied project and includes account-isolated rules. Live Google and email sign-in, deployed Firestore rules, and cross-device sync require the owner's Firebase and GitHub Pages settings. Those flows were not verified against the live project.
