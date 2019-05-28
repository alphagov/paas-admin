import express from 'express';
import jwt from 'jsonwebtoken';
import {IUaaEmail, IUaaGroup, IUaaName, IUaaPhoneNumber, IUaaUser} from '../src/lib/uaa';
import * as uaa from '../src/lib/uaa';

const tokenKey = 'tokensecret';
const userId = '99022be6-feb8-4f78-96f3-7d11f4d476f1';
function mockUAA(app: express.Application, config: {stubApiPort: string, adminPort: string}) {
  const { adminPort } = config;
  const fakeJwt = jwt.sign({
    user_id: userId,
    scope: [],
    exp: 2535018460,
  }, tokenKey);

  const userPayload: IUaaUser = {
    meta: {
      version: 0,
      created: "2019-01-01T00:00:00",
      lastModified: "2019-01-02T00:00:00",
    },
    id: userId,
    externalId: 'stub-user',
    userName: 'stub-user@digital.cabinet-office.gov.uk',
    origin: 'uaa',
    active: true,
    verified: true,
    zoneId: 'uaa',
    name: {
      familyName: 'User',
      givenName: 'Stub',
    },
    emails: [
      { value: 'stub-user@digital.cabinet-office.gov.uk', primary: true },
    ],
    schemas: [ 'urn:scim:schemas:core:1.0' ],
    groups: [],
    phoneNumbers: [],
    approvals: [],
    passwordLastModified: '2019-01-01T00:00:00',
    previousLogonTime: 1546300800,
    lastLogonTime: 1546300800,
  };

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

  app.get(
    `/Users/${userId}`,
    (_req, res) => {
      res.send(JSON.stringify(userPayload));
    });

  app.put(
    `/Users/${userId}`,
    (_req, res) => {
      res.send(JSON.stringify(userPayload));
    }
  )
}

export default mockUAA;
