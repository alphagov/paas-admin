import express from 'express';
import {IAccountsUserResponse} from '../src/lib/accounts';
import * as cfStubData from '../src/lib/cf/cf.test.data';
import * as uaaStubData from '../src/lib/uaa/uaa.test.data';
import {IStubServerPorts} from './index';

function mockAccounts(app: express.Application, _config: IStubServerPorts): express.Application {
  // All users have no documents
  app.get('/users/:guid/documents', (_req, res) => {
    res.send(JSON.stringify([]));
  });

  // All users should have a paas-accounts entry.
  // We need to gather the IDs from different places
  // in our stub data, in order for everything to
  // fit together.
  const cfUsers = JSON.parse(cfStubData.users);
  const userIds = cfUsers.resources.map((x: any) => x.metadata.guid);
  userIds.push(uaaStubData.userId);
  for (const id of userIds) {
    app.get(`/users/${id}`, (_req, res) => {
        const userBody: IAccountsUserResponse = {
          user_uuid: id,
          username: `${id}@fake.cabinet-office.gov.uk`,
          user_email: `${id}@fake.cabinet-office.gov.uk`,
        };

        res.send(JSON.stringify(userBody));
    });
  }

  return app;
}

export default mockAccounts;
