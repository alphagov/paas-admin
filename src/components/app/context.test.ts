import Router, {IParameters, IResponse} from '../../lib/router';
import {config} from './app.test.config';
import {IContext, initContext} from './context';

const noopActionFunc =
  async (_: IContext, __: IParameters): Promise<IResponse> => {
    return new Promise<IResponse>(
      (resolve) => resolve({body: 'noop'}),
    );
  };

describe('IContext', () => {
  describe('linkTo', () => {
    it('should generate a relative URL by default', () => {
      const router = new Router([
        {
          action: noopActionFunc,
          name: 'test',
          path: '/test',
        },
      ]);
      const req = {
        log: {},
        token: {},
        session: {},
        csrfToken: () => '',
      };
      const ctx = initContext(req, router, router.routes[0], config);

      const link = ctx.linkTo('test');

      expect(link).not.toContain(config.domainName);
    });
  });

  describe('absoluteLinkTo', () => {
    it('should generate an absolute URL', () => {
      const router = new Router([
        {
          action: noopActionFunc,
          name: 'test',
          path: '/test',
        },
      ]);
      const req = {
        log: {},
        token: {},
        session: {},
        csrfToken: () => '',
      };
      const ctx = initContext(req, router, router.routes[0], config);

      const link = ctx.absoluteLinkTo('test');

      expect(link).toContain(config.domainName);
    });
  });
});
