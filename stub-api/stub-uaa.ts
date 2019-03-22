import express from 'express';
import jwt from 'jsonwebtoken';

const tokenKey = 'tokensecret';
function mockUAA(app: express.Application, config: {stubApiPort: string, adminPort: string}) {
  const { adminPort } = config;
  const fakeJwt = jwt.sign({
    user_id: 'some-user',
    scope: [],
    exp: 2535018460,
  }, tokenKey);

  app.post(
    '/oauth/token',
    (_req, res) => res.send(JSON.stringify({access_token: fakeJwt}))
  );

  app.get(
    '/oauth/authorize',
    (_req, res) => {
      const location = `http://0:${adminPort}/auth/login/callback?code=some-code`;
      res.redirect(301, location);
    }
  );

  app.get(
    '/token_keys',
    (_req, res) => res.send(JSON.stringify({keys: [{value: tokenKey}]}))
  );

}

export default mockUAA;
