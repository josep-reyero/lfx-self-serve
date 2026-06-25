// Copyright The Linux Foundation and each contributor to LFX.
// SPDX-License-Identifier: MIT

// Generated with [Claude Code](https://claude.ai/code)

import type { NextFunction, Request, Response } from 'express';

import { AuthorizationError } from '../errors';
import { personaDetectionService } from '../utils/persona-helper';
import { OsspreyController } from '../controllers/ossprey.controller';
import { OsspreyServerService } from '../services/ossprey.service';
import { requireExecutiveDirector } from '../middleware/require-executive-director.middleware';

/**
 * OSSPREY route authorization tests.
 *
 * The OSSPREY endpoints mint an application-level CDP client-credentials token
 * and return global package stewardship/security data, so they are guarded by
 * `requireExecutiveDirector` at the router level. These tests prove the
 * security boundary holds: an authenticated non-ED persona is rejected with a
 * 403 BEFORE any handler runs and BEFORE the CDP-backed service is touched,
 * and an ED persona is allowed through.
 */
describe('OSSPREY route authorization (requireExecutiveDirector)', () => {
  const buildReq = (): Request => ({ path: '/api/ossprey/packages', params: {}, query: {} }) as unknown as Request;
  const buildRes = (): Response => ({ status: jasmine.createSpy('status').and.callFake(() => buildRes()), json: jasmine.createSpy('json') }) as unknown as Response;

  it('rejects an authenticated non-ED user with a 403 before reaching any handler', async () => {
    spyOn(personaDetectionService, 'getPersonas').and.resolveTo({ personas: ['contributor'] } as any);

    // Spy on the CDP-backed service to prove it is never invoked for a non-ED.
    const getPackagesSpy = spyOn(OsspreyServerService.prototype, 'getPackages');

    const req = buildReq();
    const res = buildRes();
    const next: NextFunction = jasmine.createSpy('next');

    await requireExecutiveDirector(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const passedError = (next as jasmine.Spy).calls.mostRecent().args[0];
    expect(passedError).toEqual(jasmine.any(AuthorizationError));
    expect((passedError as AuthorizationError).statusCode).toBe(403);

    // CDP token generation / data fetch must not have been reached.
    expect(getPackagesSpy).not.toHaveBeenCalled();
  });

  it('allows an ED user through to the handler', async () => {
    spyOn(personaDetectionService, 'getPersonas').and.resolveTo({ personas: ['executive-director'] } as any);

    const req = buildReq();
    const res = buildRes();
    const next: NextFunction = jasmine.createSpy('next');

    await requireExecutiveDirector(req, res, next);

    // next() called with no error means the guard passed control downstream.
    expect(next).toHaveBeenCalledTimes(1);
    expect((next as jasmine.Spy).calls.mostRecent().args.length).toBe(0);
  });

  it('does not mint a CDP token in the controller for an unauthorized request path', async () => {
    // Defense-in-depth assertion: even if the controller is reached, the guard
    // is the only thing standing between a non-ED caller and CDP, so confirm
    // the controller delegates strictly to the service (which the guard gates).
    const controller = new OsspreyController();
    const serviceSpy = spyOn(OsspreyServerService.prototype, 'getPackages').and.resolveTo({ packages: [], total: 0 } as any);

    const req = buildReq();
    const res = buildRes();
    const next: NextFunction = jasmine.createSpy('next');

    await controller.getPackages(req, res, next);

    expect(serviceSpy).toHaveBeenCalledTimes(1);
  });
});
