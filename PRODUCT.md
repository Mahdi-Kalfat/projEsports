# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are competitive and casual esports players in Tunisia and the wider MENA region — solo and squad competitors in Valorant, Rocket League, and CS2 who register for tournaments, track rank/level/XP progress, trade gear and accounts, and socialize (clans, friends, profile walls, messaging). A secondary role is the platform's own admin/moderation staff, who run tournaments, events, the shop, marketplace approvals, the items/battle-pass/rewards economy, and user moderation through a separate back office app.

## Product Purpose

EsportWeb is a tournament and gaming-community platform, not a bracket-only utility. Its core loop, carried over from the product's own stated vision: **compete → progress → earn → flex → return.** Players don't just register for cups; they accumulate points and XP, level up, unlock battle-pass tiers, spin a daily lucky wheel, claim daily login rewards, trade in a peer marketplace, join clans, and build a public profile — the tournament layer feeds a persistent progression/economy layer, which is what brings players back between events.

## Positioning

*[Inferred from the codebase and the original product brief — not separately confirmed this session.]* A generic tournament-bracket site could not truthfully copy this platform's depth of retention mechanics (points economy, XP/levels, battle pass, daily rewards, lucky wheel, marketplace, clans) layered under the competitive core, nor its explicit MENA/Tunisia identity (confirmed this session) in a category that is overwhelmingly built for a US/EU audience.

## Operating Context

- Two separate Next.js apps share one MongoDB: **frontoffice** (the player-facing site) and **backoffice** (the admin panel). Admins configure nearly everything players see — tournaments, events, shop items, marketplace moderation, items (the reward-item catalog), battle-pass tiers, lucky-wheel slices, daily-reward days, level XP curve.
- Games currently supported: Valorant, Rocket League, CS2 — each already carries a distinct visual identity in existing art (per-game hero imagery on the landing page and clan cards).
- Points (in-app currency) and DT (Tunisian Dinar, real-world currency) coexist as two separate price types across tournaments, shop, and marketplace.

## Capabilities and Constraints

**Built and live:** tournament browse/register (solo or team), event RSVP, shop browsing (purchases intentionally locked — "coming soon"), peer marketplace (admin-moderated, money listings settle by direct contact, no payment processor), clans (create/join/manage, min-level gated), friends (friend-code based) + direct messaging, profile with a wall/post feed, inventory (cosmetic items + consumable/effect items), battle pass (tiered free/premium rewards drawn from the admin item catalog), daily login rewards + lucky wheel (both free, once per UTC day, granting items from the same catalog), points/level/XP economy.

**Explicitly not built yet, confirmed in scope for this redesign's planning (though not for this pass's implementation):**
- No leaderboard/ranking page exists anywhere (the word appears once, in marketing copy).
- No bracket or match-result visualization — tournament detail is a registration/info page with a flat participant list.
- No internationalization system at all — `lang="en"` is hardcoded, zero i18n libraries installed, no Arabic/French strings, no RTL handling.
- "Teams" in the original vision doc is implemented as **Clans** — functionally related, named differently; not to be treated as a separate missing feature.
- No Discord integration (one placeholder string only).
- No payment processor — money-priced flows resolve to manual/"contact seller"/"contact admin" states by design, confirmed to remain that way through this redesign.

**Technical constraints:** Next.js 16 (App Router, Server Components + Server Actions, no client state library), React 19, Tailwind v4 (CSS-first `@theme`, no `tailwind.config.js`), Prisma 6 + MongoDB, `motion/react` for animation, NextAuth v5 (credentials/JWT). Chakra Petch (display) + Inter (body) fonts already loaded via `next/font/google`.

## Brand Commitments

- Name: **Clutcher**, wordmark is the logo image (silver "C" mark + red lightning bolt, "CLUTCHER" text), used consistently across both apps.
- An established dark neon palette is already in production and treated as a binding starting point, not a blank slate: canvas `#0A0A0F`, surface `#14141C`, surface-raised `#1E1E2A`, primary `#FF1E3C`, primary-glow `#FF335A`, crimson `#B0001E`, accent `#00E5FF`, success `#28FF8B`, warning `#FFC542`. This already matches the product's own written design directive closely.
- Confirmed this session: MENA/Tunisia regional identity is a real brand commitment, not incidental — visual and typographic direction should support Arabic pairing and RTL-readiness even before RTL implementation ships.

## Evidence on Hand

- Real production-shaped data exists from the app's own admin and real end users signing up and using it live (not only seed data): a handful of real accounts, a real marketplace listing with real product photography, a real battle-pass season, a real admin-created reward item with uploaded art.
- Seeded demo data (220+ demo users, ~20 tournaments, 3 games) is realistic in shape but sparse in art direction — most tournament cards, all but one event, and both shop/marketplace listings currently have no or placeholder imagery. Future design work should not assume rich imagery is already present everywhere; card systems must look intentional with zero or one piece of art, not just with a full set.
- No customer testimonials, press, benchmarks, or pricing claims exist or should be fabricated.

## Product Principles

1. The competitive core (tournaments) and the retention core (progression/economy/social) are equally load-bearing — neither is decoration for the other.
2. Admin-authored content (tournaments, items, battle pass, rewards, marketplace moderation) is the backbone of what players see; the design system must look intentional even when that content is sparse, not just at full density.
3. MENA/Tunisia identity is real, not a reskin afterthought — typography, imagery, and layout choices should hold up in Arabic/RTL even ahead of that implementation.
4. Money-priced flows are honestly unfinished right now; the design should make "coming soon" / "contact to arrange" feel like a deliberate, trustworthy state, not a broken one.
5. Each of the three supported games (Valorant, Rocket League, CS2) gets its own visual accent within one unified platform system — never a fully separate skin.

## Accessibility & Inclusion

No formal accessibility standard was specified. Known gaps from this session's audit to carry forward: no skip-to-content link, some content-bearing images use empty `alt`, no documented focus-visible system beyond default input focus rings, RTL not implemented despite Arabic being a stated commitment.
