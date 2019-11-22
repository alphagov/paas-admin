import jwt from 'jsonwebtoken';

import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';
import {CLOUD_CONTROLLER_ADMIN} from '../auth/has-role';

import {
  Token,
} from '../auth';

import { redirectToPage } from './redirect';

const tokenKey = 'secret';

describe('redrect', () => {
  describe('when not a platform admin', () => {

    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      user_id: 'uaa-id-253',
      scope: [],
      exp: (time + (24 * 60 * 60)),
      origin: 'uaa',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    it('should return an error', async () => {
      await expect(
        redirectToPage(ctx, {}, {}),
      ).rejects.toThrow(/not a platform admin/);
    });
  });

  describe('when a platform admin', () => {

    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      user_id: 'uaa-id-253',
      scope: [CLOUD_CONTROLLER_ADMIN],
      exp: (time + (24 * 60 * 60)),
      origin: 'uaa',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    describe('when the action is not present', () => {
      it('should throw an error', async () => {
        await expect(
          redirectToPage(ctx, {}, {}),
        ).rejects.toThrow(/Action not present/);
      });
    });

    describe('when the action is unknown', () => {
      it('should throw an error', async () => {
        await expect(
          redirectToPage(ctx, {}, { action: 'this-action-is-not-supported' }),
        ).rejects.toThrow(/Unknown action: this-action-is-not-supported/);
      });
    });

    describe('when the action is find-user', () => {
      [undefined, ''].map(emailOrUserGUID => {
        it(`should throw an error if email-or-user-guid is ${emailOrUserGUID}`, async () => {
          await expect(
            redirectToPage(ctx, {}, {
              'action': 'find-user',
              'email-or-user-guid': emailOrUserGUID,
            }),
          ).rejects.toThrow(/Field email-or-user-guid is undefined or blank/);
        });
      });

      it(`should redirect to the users page`, async () => {
        const response = await redirectToPage(ctx, {}, {
          'action': 'find-user',
          'email-or-user-guid': 'user@domain.com',
        });

        expect(response.redirect).toEqual(`__LINKED_TO__users.get`);
      });
    });

    describe('when the action is view-costs', () => {
      [undefined, ''].map((month) => {
        it(`should throw an error if month is ${month}`, async () => {
          await expect(
            redirectToPage(ctx, {}, {
              action: 'view-costs', month, year:   '2019', format: 'cost',
            }),
          ).rejects.toThrow(/Field month is undefined or blank/);
        });
      });

      [undefined, ''].map((year) => {
        it(`should throw an error if year is ${year}`, async () => {
          await expect(
            redirectToPage(ctx, {}, {
              action: 'view-costs', month: '01', year, format: 'cost',
            }),
          ).rejects.toThrow(/Field year is undefined or blank/);
        });
      });

      [undefined, ''].map((format) => {
        it(`should throw an error if format is ${format}`, async () => {
          await expect(
            redirectToPage(ctx, {}, {
              action: 'view-costs', month: '01', year: '2019', format,
            }),
          ).rejects.toThrow(/Field format is undefined or blank/);
        });
      });

      it('should throw an error if range start is incorrect', async () => {
        await expect(
          redirectToPage(ctx, {}, {
            action: 'view-costs', month: 'blah', year: 'blah', format: 'cost',
          }),
        ).rejects.toThrow(/Constructed date is invalid, should be YYYY-MM-DD: blah-blah-01/);
      });

      ['cost', 'cost-by-service', 'pmo-org-spend-csv', 'visualisation'].forEach((format) => {
        it(`should redirect to the ${format} report`, async () => {
          const response = await redirectToPage(ctx, {}, {
            action: 'view-costs', month:  '06', year: '2019', format,
          });

          expect(response.redirect).toEqual(`__LINKED_TO__admin.reports.${format}`);
        });
      });
    });
  });
});
