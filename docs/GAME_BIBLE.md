# Ganjumanji: The Lost Grower's Temple — Game Bible

## Product identity

Ganjumanji is an original third-person browser exploration/adventure game set inside a cannabis-fantasy grow temple. It is not a digital conversion of an existing board game and must not reproduce another game's board geometry, named characters, text, logos, props, puzzles, or trade dress.

## Player fantasy

You are a lost grower navigating an overgrown seed temple whose cultivation systems have become dangerous. Read the environment, recover botanical relics, survive hazards, and open deeper temple chambers.

## Primary verbs

- Explore
- Navigate
- Sprint
- Avoid
- Collect
- Unlock
- Survive

Future chambers may add inspect, activate, climb, push, solve, and defend, but the first slice intentionally keeps the verb set small.

## First playable: Temple Atrium

Session target: 3–6 minutes.

1. Spawn at the atrium entrance with 3 Resolve.
2. Explore the chamber and recover three Seed Sigils:
   - Root Sigil
   - Canopy Sigil
   - Resin Sigil
3. Avoid active spore vents. A hit costs 1 Resolve and returns the player to the entrance.
4. Reaching zero Resolve restarts the run and clears collected sigils.
5. Recovering all three sigils opens the Canopy Gate.
6. Reach the gate to clear the atrium.

## World direction

The temple should feel ancient, humid, botanical, mysterious, and readable rather than visually noisy. Architecture combines stone grow infrastructure, roots, vines, cultivation symbolism, seed motifs, and warm relic lighting. The first playable uses code-built geometry so gameplay can be tested before production art is locked.

## Camera

Third-person chase camera with smooth follow. Camera state is presentation only and never authoritative gameplay state.

## Progression direction

A later full game can connect compact chambers into a temple expedition:

- Temple Atrium — movement, hazards, collection, gate unlock
- Root Archive — route choice and underground traversal
- Canopy Galleries — vertical traversal and light puzzles
- Resin Vault — timing/security hazards
- Keeper Chamber — encounter/boss-style challenge

These names are internal direction, not promises of completed content.

## Failure and fairness

- Hazards must be visible before contact.
- Damage/reset feedback must be immediate.
- Progress loss is limited to the current short run in the first slice.
- No pay-to-win, loot-box, or gambling loop.
- Controls must remain usable with keyboard and touch.

## Completion standard for the vertical slice

The Temple Atrium is only considered a verified vertical slice when:

- deterministic simulation tests pass;
- TypeScript/build passes;
- Chromium desktop QA passes;
- 390px mobile/touch QA passes;
- no production route is advertised before a controlled DTFSeeds integration is approved.
