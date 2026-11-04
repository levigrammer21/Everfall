# Everfall 1.0.0 build report

## Included

- The 50 heroes and 30 pets have named signatures or instincts, defined triggers, condition checks, elemental effects, and ascension follow-ups. The five skills per hero can open, extend, or consume a hero-specific combo. Mastery branches retain prior purchases and offer a choice of capstone on new training.
- The battlefield uses ten illustrated biome backgrounds and four illustrated dungeon backgrounds, with a layered moving foreground. The sprite atlas includes character-specific pixel accents and dedicated boss appearances. Pose sheets load on demand for idle, travel, attack, special, impact, and death.
- Dungeon checkpoints serialize combatants, resources, status sources, pending loot, skill timers, and random state. Closing the browser resumes the latest persisted mid-wave checkpoint. Completed waves and reward claims retain their existing settlement rules.
- The four dungeon bosses have different attacks and low-health follow-ups. The Wandering Merchant, Lost Caravan, and Secret Shrine offer one-time choices after discovery. Guild Headquarters adds three upgrade tracks that improve the output of existing assignments.
- The on-field meter tracks individual encounters. The build journal groups waves by hero, companion, gear, masteries, and tactics. Farming records aggregate online and sampled offline results by stage.
- Offline farming budgets time for movement and engagement between waves. Gold and keys accrue more slowly, and the guild upgrades create new uses for gold. The single-summon opening, equipment, loot log, and on-field drops carry forward from 0.9.1.

## Verification

- TypeScript and Vite production build succeeded.
- All 22 automated tests passed. They cover the original systems, solo opening for all 50 heroes, all hero and companion signature profiles, exact deterministic dungeon resume, offer settlement, guild upgrades, build journals, offline accounting, and save migration.
- The production build passed portrait and landscape Chromium checks at a GitHub Pages-style subpath. The checks exercised the first summon, live meter, dungeon artwork, a mid-wave checkpoint, all three rare encounter choices, guild upgrades, build journals, and an offline reload. Chromium reported zero page errors and failed local asset requests.
- Two seeded progression simulations covered one hour, one day, one week, one month, and three months. They automatically invested in heroes, gear, and masteries. They did not exercise every possible build, purchase guild upgrades, or spend dungeon keys.

| Milestone | Seed 31415 | Seed 61423 |
| --- | ---: | ---: |
| Stage cleared after one hour | 3 | 3 |
| Stage cleared after one day | 16 | 17 |
| Stage cleared after one week | 118 | 116 |
| Stage cleared after one month | 444 | 410 |
| Stage cleared after three months | 1,005 | 911 |
| Active hero level after three months | 379 | 356 |
| Gold after one month | 79.7 million | 66.4 million |
| Keys after one month | 1,949 | 1,441 |

## Remaining verification and scope

- Live Google and email sign-in and cross-device recovery were not verified with the owner’s account during this release. The existing Firebase project, rules format, and browser save key are retained.
- The mobile browser checks use emulated viewports. Sustained frame rate and thermal behavior on physical phones still need device testing.
- Both simulations filled the hero and pet collections within a month. The active heroes still had ascension and level progression after three months. Long-term collection pacing and the unspent key totals remain balance targets.
- The characters use distinct pixel details and pose frames built from reusable sprite shapes. Individual hand-drawn animation sheets for every hero, pet, and enemy were not created. The combat engine also reuses effect primitives across named abilities, with different combinations, conditions, and follow-ups.
- Long offline absences use sampled combat and aggregated rewards. The game retains a selection of rolled gear and pays gold for excess drops. The stage counter retains a numerical guard at one billion.
