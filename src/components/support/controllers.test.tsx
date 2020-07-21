import jwt from 'jsonwebtoken';
import nock from 'nock';


import { IContext } from '../app';
import { createTestContext } from '../app/app.test-helpers';
import { Token } from '../auth';

import * as controller from './controllers';

const tokenKey = 'secret';
const token = jwt.sign(
  {
    exp: 2535018460,
    origin: 'uaa',
    scope: [],
    user_id: 'uaa-id-253',
  },
  tokenKey,
);

const ctx: IContext = createTestContext({
  linkTo: (name: any, params: any) =>
    `${name}/${params ? params.rangeStart : ''}`,
  token: new Token(token, [tokenKey]),
});

let nockZD: nock.Scope;

describe(controller.HandleSignupFormPost, () => {
  beforeEach(() => {
    nock.cleanAll();

    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nockZD.done();

    nock.cleanAll();
  });

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleSignupFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      department_agency: undefined,
      service_team: undefined,
      person_is_manager: undefined,
      invite_users: undefined,
      additional_users: [{ email: 'jeff', person_is_manager: 'no' }, {}, {}],
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your request');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your department or agency');
    expect(response.body).toContain('Enter your service or team');
    expect(response.body).toContain('Select the appropriate option for an org manager');
    expect(response.body).toContain('Select &quot;Yes&quot; if you would like to invite users to your organisation');
    expect(response.body).toContain('Enter additional user 1 email address in the correct format');
  });

  it('should throw validation errors when unsupported email address has been provided', async () => {
    const response = await controller.HandleSignupFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.com',
      department_agency: 'Naming Authority',
      service_team: 'Digital',
      person_is_manager: 'yes',
      invite_users: 'no',
      additional_users: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your request');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('We only accept .gov.uk, .mod.uk, nhs.net, nhs.uk, .police.uk or police.uk email addresses');
  });

  it('should create a zendesk ticket correctly', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleSignupFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      department_agency: 'Naming Authority',
      service_team: 'Digital',
      person_is_manager: 'yes',
      invite_users: 'yes',
      additional_users: [{ email: 'ann@example.gov.uk', person_is_manager: 'no' }, { email: 'bill@example.gov.uk', person_is_manager: 'yes' }, {}],
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your request');
  });

  it('should create a zendesk ticket correctly when no additional users provided', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleSignupFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      department_agency: 'Naming Authority',
      service_team: 'Digital',
      person_is_manager: 'no',
      invite_users: 'yes',
      additional_users: undefined,
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your request');
  });
});

describe(controller.HandleContactUsFormPost, () => {
  beforeEach(() => {
    nock.cleanAll();

    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nockZD.done();

    nock.cleanAll();
  });

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleContactUsFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
      department_agency: undefined,
      service_team: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your message');
    expect(response.body).toContain('Enter your department or agency');
    expect(response.body).toContain('Enter your service or team');
  });

  it('should create a zendesk ticket correctly', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleContactUsFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
      department_agency: 'Naming Authority',
      service_team: 'Digital',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleFindOutMoreFormPost, () => {
  beforeEach(() => {
    nock.cleanAll();

    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nockZD.done();

    nock.cleanAll();
  });

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleFindOutMoreFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
      gov_organisation_name: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your message');
    expect(response.body).toContain('Enter your government organisation’s name');
  });

  it('should create a zendesk ticket correctly', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleFindOutMoreFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
      gov_organisation_name: 'Naming Authority',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleHelpUsingPaasFormPost, () => {
  beforeEach(() => {
    nock.cleanAll();

    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nockZD.done();

    nock.cleanAll();
  });

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your message');
  });

  it('should create a zendesk ticket correctly', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      paas_organisation_name: '__FAKE_ORG__',
      message: 'Comment',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should create a zendesk ticket correctly when no org has been provided', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleSomethingWrongWithServiceFormPost, () => {
  beforeEach(() => {
    nock.cleanAll();

    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nockZD.done();

    nock.cleanAll();
  });

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
      affected_paas_organisation: undefined,
      impact_severity: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter the name of the affected organisation');
    expect(response.body).toContain('Select the severity of the impact');
    expect(response.body).toContain('Enter your message');
  });

  it('should create a zendesk ticket correctly', async () => {
    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'critical',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleSupportSelectionFormPost, () => {
  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleSupportSelectionFormPost(ctx, {}, {
      support_type: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Select which type of support your require');
  });

  it('should carry on', async () => {
    const response = await controller.HandleSupportSelectionFormPost(ctx, {}, {
      support_type: 'general',
    } as any);

    expect(response.status).toBeUndefined();
  });
});
