// Copyright The Linux Foundation and each contributor to LFX.
// SPDX-License-Identifier: MIT

import { Router } from 'express';

import { OsspreyController } from '../controllers/ossprey.controller';
import { requireExecutiveDirector } from '../middleware/require-executive-director.middleware';

const router = Router();
const osspreyController = new OsspreyController();

// OSSPREY exposes global package stewardship/security data fetched via an
// application-level CDP client-credentials token. These are admin/ED-only
// dashboard endpoints, so enforce server-verified ED authorization on every
// route before any handler can mint a CDP token. The generic /api auth that
// covers this router only proves the caller is authenticated, not privileged.
router.use(requireExecutiveDirector);

router.get('/packages', osspreyController.getPackages.bind(osspreyController));
router.get('/packages/:purl', osspreyController.getPackage.bind(osspreyController));

export default router;
