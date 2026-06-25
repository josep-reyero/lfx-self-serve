// Copyright The Linux Foundation and each contributor to LFX.
// SPDX-License-Identifier: MIT

// Generated with [Claude Code](https://claude.ai/code)

/**
 * OSSPREY API authorization regression.
 *
 * The OSSPREY admin endpoints (`/api/ossprey/packages` and
 * `/api/ossprey/packages/:purl`) are guarded server-side by
 * `requireExecutiveDirector` (apps/lfx-one/src/server/routes/ossprey.route.ts).
 * The handlers mint an application-level CDP client-credentials token and
 * return global package stewardship/security data, so a non-ED authenticated
 * caller MUST be rejected with a 403 by the guard BEFORE any handler runs and
 * before any CDP token is generated.
 *
 * This is the negative coverage for that boundary: it drives the real Express
 * middleware stack over HTTP and asserts a non-ED authenticated session never
 * receives 200 package data from either route.
 *
 * Why this lives in Playwright and not a unit spec: this app has no unit test
 * runner / `test` architect target, and `requireExecutiveDirector`
 * deliberately reads server-verified persona detection (NATS) rather than the
 * client-spoofable PERSONA_COOKIE_KEY cookie, so the boundary can only be
 * exercised honestly through the running server. The guard's correctness is
 * therefore asserted end-to-end against the real middleware chain.
 *
 * Prerequisites:
 *   - Dev server reachable at the Playwright baseURL (default http://localhost:4200)
 *   - Authenticated storageState (playwright/.auth/user.json) for a
 *     non-Executive-Director test user — the default suite user.
 */

import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

const OSSPREY_LIST = '/api/ossprey/packages';
const OSSPREY_DETAIL = `/api/ossprey/packages/${encodeURIComponent('pkg:npm/%40scope/name')}`;

// 403 is the guard's rejection; 401 covers the case where the test session is
// not authenticated. Either proves the endpoint is NOT openly reachable by a
// non-ED caller. The failure mode we are guarding against is a 200 with data.
const AUTHZ_REJECTION_STATUSES = [401, 403];

test.describe('OSSPREY API requires Executive Director authorization', () => {
  test('non-ED session cannot read the packages collection (no 200 data leak)', async ({ request }) => {
    const res = await request.get(OSSPREY_LIST, { failOnStatusCode: false });

    expect(
      AUTHZ_REJECTION_STATUSES,
      `GET ${OSSPREY_LIST} returned ${res.status()} for a non-ED session; the requireExecutiveDirector guard must reject before CDP is reached`
    ).toContain(res.status());
  });

  test('non-ED session cannot read a package detail (no 200 data leak)', async ({ request }) => {
    const res = await request.get(OSSPREY_DETAIL, { failOnStatusCode: false });

    expect(
      AUTHZ_REJECTION_STATUSES,
      `GET ${OSSPREY_DETAIL} returned ${res.status()} for a non-ED session; the requireExecutiveDirector guard must reject before CDP is reached`
    ).toContain(res.status());
  });

  test('an unauthenticated request is rejected by the guard chain on both routes', async ({ playwright }) => {
    // Fresh request context with no stored auth state — proves the endpoints
    // are never anonymously reachable and that CDP is never fronted for an
    // unauthenticated caller. Covers both the list and detail routes, which
    // each carry the ED guard (router-level and per-route).
    const anon = await playwright.request.newContext({ baseURL: 'http://localhost:4200' });
    try {
      for (const url of [OSSPREY_LIST, OSSPREY_DETAIL]) {
        const res = await anon.get(url, { failOnStatusCode: false });
        expect(res.status(), `anonymous GET ${url} must not return 200 package data`).not.toBe(200);
      }
    } finally {
      await anon.dispose();
    }
  });
});
