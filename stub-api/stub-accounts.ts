import express from 'express';
import {IAccountsUserResponse, IAccountsUsersResponse} from '../src/lib/accounts';
import * as cfStubData from '../src/lib/cf/cf.test.data';
import * as uaaStubData from '../src/lib/uaa/uaa.test.data';
import {IStubServerPorts} from './index';

function makeUser(id: string): IAccountsUserResponse {
  return {
    user_uuid: id,
    username: `${id}@fake.cabinet-office.gov.uk`,
    user_email: `${id}@fake.cabinet-office.gov.uk`,
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
