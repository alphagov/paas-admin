import express from 'express';

import { IAccountsUserResponse } from '../src/lib/accounts';
import * as cfStubData from '../src/lib/cf/cf.test.data';
import * as uaaStubData from '../src/lib/uaa/uaa.test.data';

import { IStubServerPorts } from './index';

function makeUser(id: string): IAccountsUserResponse {
  return {
    user_email: `${id}@fake.cabinet-office.gov.uk`,
    user_uuid: id,
    username: `${id}@fake.cabinet-office.gov.uk`,
  };
}

function mockAccounts(app: express.Application, _config: IStubServerPorts): express.Application {
  // All users have no documents
  app.get('/users/:guid/documents', (_req, res) => {
    res.send(JSON.stringify([]));
  });

  const cfUsers = JSON.parse(cfStubData.users);
  const userIds = cfUsers.resources.map((x: any) => x.metadata.guid);
  userIds.push(uaaStubData.userId);

  app.get('/users', (req, res) => {
    const uuids = req.query.uuids;
    const email = req.query.email;
    if (typeof email !== 'string' && typeof uuids !== 'string') {
      res.status(400).send('No uuids or email');

return;
    }

    if (typeof email === 'string') {
      const uuid = email.split('@')[0];

      if (userIds.indexOf(uuid) >= 0) {
        res.send(JSON.stringify({
          users: [makeUser(uuid)],
        }));
      } else {
        res.status(404).send('Not found');
      }

return;
    }

    const uuidsAsList: ReadonlyArray<string> = (uuids as string).split(',');
    const uuidsThatExist = uuidsAsList.filter(id => userIds.indexOf(id) >= 0);

    res.send(JSON.stringify({
      users: uuidsThatExist.map((id: string) => makeUser(id)),
    }));
  });

  app.get('/users/:guid', (req, res) => {
    // Satisfy TS compiler
    if (typeof req.params.guid !== 'string') {
      res.status(400).send('No guid');

return;
    }

    const id: string = req.params.guid;
    if (userIds.indexOf(id) >= 0) {
      res.send(JSON.stringify(makeUser(id)));
    } else {
      res.status(404).send('Not found');
    }
  });

  return app;
}

export default mockAccounts;
