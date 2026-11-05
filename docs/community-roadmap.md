# SSC13BD Community Direction

## Purpose

Reconnect friends who sat Bangladesh's SSC examination in 2013, wherever life has taken them. A member should be able to ask the whole community for help, find a trusted batchmate nearby, or offer an opportunity to someone back home.

## Current release

The deployed frontend and backend provide the directory, SOS requests and replies, targeted dashboard notifications, events and RSVPs, shared photo links, private expenses, and moderator batch verification. Login activation is deferred. Database writes remain protected; synthetic members and emergencies exist only in the labeled local preview.

## Next iteration: Google identity and administration

Implement one Google sign-in provider for every account. Enforce member, moderator, and administrator roles on the server. Test first sign-in, returning users, denied privileges, controlled administrator provisioning, and batch approval against staging before launch. Directory participation remains an explicit choice.

## World map: connected to Bangladesh

Add opt-in country/city and approximate location to profiles. Represent consenting registered members as clustered world-map dots, with animated connecting arcs converging on Bangladesh. Show public aggregates and expose profiles only according to their visibility and verification choices. Accounts without consent or a usable location contribute to totals without a public dot.

Use member-chosen locations rather than silently publishing GPS or IP-derived positions. Explain that the dots represent chosen locations, not live online presence. Provide a country/district list alternative, keyboard navigation, reduced-motion support, and mobile-friendly rendering. Bundle geographic data where practical; the current application needs no map API key. Select an external map/geocoding provider only when needed, then document its credentials.

## Mutual aid and opportunities

Improve community-wide SOS discovery, offers of help, resolved outcomes, and abuse reporting while preserving urgent-category targeting and private verification details. A friend in distress should have a clear way to ask for support.

Add a dedicated board for jobs, referrals, mentoring, and relocation guidance. An overseas batchmate can offer a job or referral to friends in Bangladesh. Include country, remote/on-site status, eligibility, expiry, and an application/contact route, with moderation and employer/agency disclosures. Keep opportunities distinct from urgent help requests.

## Delivery order

1. Google login, account lifecycle, and controlled moderator/admin onboarding.
2. Consented location profiles and the animated global community map.
3. Jobs, referrals, and opportunity moderation.
4. Better help discovery, notifications, and outcome tracking.

Retain serverless deployment, indexed bounded queries, accessible mobile interactions, and measured free-tier resource use throughout.
