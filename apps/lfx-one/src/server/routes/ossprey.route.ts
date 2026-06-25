// Copyright The Linux Foundation and each contributor to LFX.
// SPDX-License-Identifier: MIT

import { Router } from 'express';

import { OsspreyController } from '../controllers/ossprey.controller';
import { requireExecutiveDirector } from '../middleware/require-executive-director.middleware';

const router = Router();
const osspreyController = new OsspreyController();

// OSSPREY exposes global package stewardship/security data fetched via an
// application-level CDP client-credentials token. These are admin/ED-only
// dashboard endpoints, so enforce server-verified ED authorization before any
// handler can mint a CDP token. The generic /api auth that covers this router
// only proves the caller is authenticated, not privileged.
//
// The guard is applied at the router level AND on each route as defense in
// depth: a future route added without thinking about authz, or an accidental
// removal of the router-level guard, still cannot reach a handler without an
// ED check. Authorization is derived from server-verified persona detection,
// never from the client-spoofable PERSONA_COOKIE_KEY cookie.
router.use(requireExecutiveDirector);

router.get('/packages', requireExecutiveDirector, osspreyController.getPackages.bind(osspreyController));
router.get('/packages/:purl', requireExecutiveDirector, osspreyController.getPackage.bind(osspreyController));

export default router;
