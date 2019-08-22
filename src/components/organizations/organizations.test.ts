import nock from 'nock';

import {listOrganizations} from '.';
import {anOrg, someOrgs} from '../../lib/cf/test-data/org';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const organizations = someOrgs(
  anOrg().with({entity: {name: 'c-org-name-1'}, metadata: {guid: 'a5aff246-5f5b-4cf8-87d8-f316053e4a20'}}),
  anOrg().with({entity: {name: 'd-org-name-2'}, metadata: {guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a21'}}),
  anOrg().with({entity: {name: 'b-org-name-3'}, metadata: {guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a22'}}),
  anOrg().with({entity: {name: 'a-org-name-4'}, metadata: {guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a23'}}),
);

const ctx: IContext = createTestContext();

describe('organizations test suite', () => {
  let nockCF: nock.Scope;
  let nockUAA: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock(ctx.app.cloudFoundryAPI);
    nockUAA = nock(ctx.app.uaaAPI);

    nockCF
      .get('/v2/organizations')
      .reply(200, organizations)
    ;

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)

      .get(`/Users/uaa-user-123`)
      .reply(200, uaaData.gdsUser)
    ;
  });

  afterEach(() => {
    nockCF.done();
    nockUAA.done();

    nock.cleanAll();
  });

  it('should show the organisation pages', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toContain('Choose an organisation');
  });

  it('should sort the organisations by name', async () => {
    const response = await listOrganizations(ctx, {});

    const matches = extractOrganizations(response.body as string);
    expect(matches.length).toBe(4);
    expect(matches[0]).toBe('a-org-name-4');
    expect(matches[1]).toBe('b-org-name-3');
    expect(matches[2]).toBe('c-org-name-1');
    expect(matches[3]).toBe('d-org-name-2');
  });
});

function extractOrganizations(responseBody: string): ReadonlyArray<string> {
  const re = /(.-org-name-\d)/g;
  const matches = [];
  while (true) {
    const match = re.exec(responseBody);
    if (match) {
      matches.push(match[0]);
    } else {
      return matches;
    }
  }
}
