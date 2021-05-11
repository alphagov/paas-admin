import lodash from 'lodash'
import nock from 'nock'
import pino from 'pino'

import * as data from './cf.test.data'
import { app as defaultApp } from './test-data/app'
import { auditEvent as defaultAuditEvent } from './test-data/audit-event'
import { org as defaultOrg } from './test-data/org'
import { orgRole, spaceRole } from './test-data/roles'
import { wrapResources, wrapV3Resources } from './test-data/wrap-resources'

import CloudFoundryClient from '.'

const config = {
  accessToken: 'qwerty123456',
  apiEndpoint: 'https://example.com/api',
  logger: pino({ level: 'silent' })
}

describe('lib/cf test suite', () => {
  let nockCF: nock.Scope
  let nockUAA: nock.Scope

  beforeEach(() => {
    nock.cleanAll()

    nockCF = nock(config.apiEndpoint)
    nockUAA = nock('https://example.com/uaa')
  })

  afterEach(() => {
    nockCF.on('response', () => {
      nockCF.done()
    })
    nockUAA.done()

    nock.cleanAll()
  })

  it('should fail to get token client without accessToken or clientCredentials', async () => {
    const client = new CloudFoundryClient({
      apiEndpoint: 'https://example.com/api',
      logger: pino({ level: 'silent' })
    })
    await expect(client.getAccessToken()).rejects.toThrow(
      /accessToken or clientCredentials are required/
    )
  })

  it('should get token from tokenEndpoint in info', async () => {
    nockCF.get('/v2/info').reply(200, data.info)
    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "TOKEN_FROM_ENDPOINT"}')

    const client = new CloudFoundryClient({
      apiEndpoint: 'https://example.com/api',
      clientCredentials: { clientID: 'my-id', clientSecret: 'my-secret' },
      logger: pino({ level: 'silent' })
    })

    expect(await client.getAccessToken()).toEqual('TOKEN_FROM_ENDPOINT')
    // Should be cached from now on. Nock should throw error if asked twice.
    expect(await client.getAccessToken()).toEqual('TOKEN_FROM_ENDPOINT')
  })

  it('should create a client correctly', async () => {
    nockCF.get('/v2/info').reply(200, data.info)

    const client = new CloudFoundryClient(config)
    const info = await client.info()
    expect(info.version).toEqual(2)
  })

  it('should iterate over all pages to gather resources', async () => {
    nockCF
      .get('/v2/test')
      .reply(200, '{"next_url":"/v2/test?page=2","resources":["a"]}')
      .get('/v2/test?page=2')
      .reply(200, '{"next_url":null,"resources":["b"]}')

    const client = new CloudFoundryClient(config)
    const response = await client.request('get', '/v2/test')
    const collection = await client.allResources(response)

    expect([...collection].length).toEqual(2)
    expect(collection[1]).toEqual('b')
  })

  it('should iterate over all v3 pages to gather resources', async () => {
    nockCF
      .get('/v3/test')
      .reply(
        200,
        '{"pagination": {"next":{"href": "/v3/test?page=2"}},"resources":["a"]}'
      )
      .get('/v3/test?page=2')
      .reply(
        200,
        '{"pagination": {"next":{"href": "/v3/test?page=3"}},"resources":["b"]}'
      )
      .get('/v3/test?page=3')
      .reply(200, '{"pagination": {"next":null},"resources":["c"]}')

    const client = new CloudFoundryClient(config)
    const response = await client.request('get', '/v3/test')
    const collection = await client.allV3Resources(response)

    expect([...collection].length).toEqual(3)
    expect(collection[1]).toEqual('b')
    expect(collection[2]).toEqual('c')
  })

  it('should retrieve an audit event', async () => {
    nockCF
      .get(`/v3/audit_events/${defaultAuditEvent().guid}`)
      .reply(200, JSON.stringify(defaultAuditEvent()))

    const client = new CloudFoundryClient(config)
    const event = await client.auditEvent(defaultAuditEvent().guid)

    expect(event).toEqual(defaultAuditEvent())
  })

  it('should retrieve an empty page of audit events', async () => {
    nockCF
      .get('/v3/audit_events')
      .query({ order_by: '-updated_at', page: 1, per_page: 25 })
      .reply(200, JSON.stringify(wrapV3Resources()))

    const client = new CloudFoundryClient(config)
    const events = await client.auditEvents()

    expect(events.resources.length).toEqual(0)
  })

  it('should list audit events for a target (ie an app or service)', async () => {
    nockCF
      .get('/v3/audit_events')
      .query({
        order_by: '-updated_at',
        page: 1,
        per_page: 25,
        target_guids: defaultAuditEvent().guid
      })
      .reply(200, JSON.stringify(wrapV3Resources(defaultAuditEvent())))

    const client = new CloudFoundryClient(config)
    const events = await client.auditEvents(
      1,
      /* targetGUIDs */ [defaultAuditEvent().guid]
    )

    expect(events.resources.length).toEqual(1)
    expect(events.resources[0].guid).toEqual(defaultAuditEvent().guid)
  })

  it('should list audit events for a space', async () => {
    nockCF
      .get('/v3/audit_events')
      .query({
        page: 1,
        per_page: 25,
        order_by: '-updated_at',
        space_guids: defaultAuditEvent().space.guid
      })
      .reply(200, JSON.stringify(wrapV3Resources(defaultAuditEvent())))

    const client = new CloudFoundryClient(config)
    const events = await client.auditEvents(
      1,
      undefined,
      /* spaceGUIDs */ [defaultAuditEvent().space.guid]
    )

    expect(events.resources.length).toEqual(1)
    expect(events.resources[0].guid).toEqual(defaultAuditEvent().guid)
  })

  it('should list audit events for an org', async () => {
    nockCF
      .get('/v3/audit_events')
      .query({
        order_by: '-updated_at',
        organization_guids: defaultAuditEvent().organization.guid,
        page: 1,
        per_page: 25
      })
      .reply(200, JSON.stringify(wrapV3Resources(defaultAuditEvent())))

    const client = new CloudFoundryClient(config)
    const events = await client.auditEvents(
      1,
      /* targetGUIDs */ undefined,
      /* spaceGUIDs */ undefined,
      /* orgGUIDs */ [defaultAuditEvent().organization.guid]
    )

    expect(events.resources.length).toEqual(1)
    expect(events.resources[0].guid).toEqual(defaultAuditEvent().guid)
  })

  it('should paginate audit events', async () => {
    nockCF
      .get('/v3/audit_events')
      .query({ order_by: '-updated_at', page: 2, per_page: 25 })
      .reply(
        200,
        JSON.stringify(
          lodash.merge(
            wrapV3Resources(
              lodash.merge(defaultAuditEvent(), { guid: 'abc' }),
              lodash.merge(defaultAuditEvent(), { guid: 'def' })
            ),
            {
              pagination: {
                next: { href: '/v3/audit_events/page=2&order_by=-updated_at' }
              }
            }
          )
        )
      )

    const client = new CloudFoundryClient(config)
    const events = await client.auditEvents(2)

    expect(events.resources.length).toEqual(2)
    expect(events.resources[0].guid).toEqual('abc')
    expect(events.resources[1].guid).toEqual('def')
  })

  it('should throw an error when receiving 404', async () => {
    nockCF.get('/v2/failure/404').reply(404, '{"error": "FAKE_404"}')

    const client = new CloudFoundryClient(config)
    await expect(client.request('get', '/v2/failure/404')).rejects.toThrow(
      /FAKE_404/
    )
  })

  it('should throw an error when encountering unrecognised error', async () => {
    nockCF.get('/v2/failure/500').reply(500, 'FAKE_500')

    const client = new CloudFoundryClient(config)
    await expect(client.request('get', '/v2/failure/500')).rejects.toThrow(
      /status 500/
    )
  })

  it('should create an organisation', async () => {
    nockCF.post('/v2/organizations').reply(201, JSON.stringify(defaultOrg()))

    const client = new CloudFoundryClient(config)
    const organization = await client.createOrganization({
      name: 'some-org-name',
      quota_definition_guid: 'some-quota-definition-guid'
    })

    expect(organization.entity.name).toEqual('the-system_domain-org-name')
  })

  it('should obtain list of organisations', async () => {
    nockCF
      .get('/v2/organizations')
      .reply(200, JSON.stringify(wrapResources(defaultOrg())))

    const client = new CloudFoundryClient(config)
    const organizations = await client.organizations()

    expect(organizations.length > 0).toBeTruthy()
    expect(organizations[0].entity.name).toEqual('the-system_domain-org-name')
  })

  it('should obtain single organisation', async () => {
    nockCF
      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20')
      .reply(200, JSON.stringify(defaultOrg()))

    const client = new CloudFoundryClient(config)
    const organization = await client.organization(
      'a7aff246-5f5b-4cf8-87d8-f316053e4a20'
    )

    expect(organization.entity.name).toEqual('the-system_domain-org-name')
  })

  it('should delete an organisation', async () => {
    nockCF
      .delete(
        '/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20?recursive=true&async=false'
      )
      .reply(204)

    const client = new CloudFoundryClient(config)
    await client.deleteOrganization({
      async: false,
      guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      recursive: true
    })
  })

  it('should list all quota definitions', async () => {
    nockCF.get('/v2/quota_definitions').reply(200, data.organizationQuotas)

    const client = new CloudFoundryClient(config)
    const quotas = await client.quotaDefinitions()

    expect(quotas.length).toBe(1)
    expect(quotas[0].entity.name).toEqual('name-1996')
  })

  it('should filter quota definitions', async () => {
    nockCF
      .get('/v2/quota_definitions?q=name:name-1996')
      .reply(200, data.organizationQuotas)

    const client = new CloudFoundryClient(config)
    const quotas = await client.quotaDefinitions({ name: 'name-1996' })

    expect(quotas.length).toBe(1)
    expect(quotas[0].entity.name).toEqual('name-1996')
  })

  it('should obtain organisation quota', async () => {
    nockCF
      .get('/v2/quota_definitions/80f3e539-a8c0-4c43-9c72-649df53da8cb')
      .reply(200, data.organizationQuota)

    const client = new CloudFoundryClient(config)
    const quota = await client.organizationQuota(
      '80f3e539-a8c0-4c43-9c72-649df53da8cb'
    )

    expect(quota.entity.name).toEqual('name-1996')
  })

  it('should obtain list of an organization\'s spaces', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, data.spaces)

    const client = new CloudFoundryClient(config)
    const spaces = await client.orgSpaces(
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275'
    )

    expect(spaces.length > 0).toBeTruthy()
    expect(spaces[0].entity.name).toEqual('name-1774')
  })

  it('should obtain list of spaces', async () => {
    nockCF.get('/v2/spaces').reply(200, data.spaces)

    const client = new CloudFoundryClient(config)
    const spaces = await client.spaces()

    expect(spaces.length > 0).toBeTruthy()
    expect(spaces[0].entity.name).toEqual('name-1774')
  })

  it('should obtain single space', async () => {
    nockCF
      .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3')
      .reply(200, data.space)

    const client = new CloudFoundryClient(config)
    const space = await client.space('bc8d3381-390d-4bd7-8c71-25309900a2e3')

    expect(space.entity.name).toEqual('name-2064')
  })

  it('should obtain single space', async () => {
    nockCF
      .get('/v2/spaces/50ae42f6-346d-4eca-9e97-f8c9e04d5fbe/summary')
      .reply(200, data.spaceSummary)

    const client = new CloudFoundryClient(config)
    const space = await client.spaceSummary(
      '50ae42f6-346d-4eca-9e97-f8c9e04d5fbe'
    )

    expect(space.name).toEqual('name-1382')
  })

  it('should obtain space quota', async () => {
    nockCF
      .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019')
      .reply(200, data.spaceQuota)

    const client = new CloudFoundryClient(config)
    const quota = await client.spaceQuota(
      'a9097bc8-c6cf-4a8f-bc47-623fa22e8019'
    )

    expect(quota.entity.name).toEqual('name-1491')
  })

  it('should obtain list of spaces for specific user in given org', async () => {
    nockCF
      .get(
        '/v2/users/uaa-id-253/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275'
      )
      .reply(200, data.spaces)

    const client = new CloudFoundryClient(config)
    const spaces = await client.spacesForUserInOrganization(
      'uaa-id-253',
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275'
    )

    expect(spaces.length > 0).toBeTruthy()
    expect(spaces[0].entity.name).toEqual('name-1774')
  })

  it('should obtain list of apps', async () => {
    const spaceGUID = 'be1f9c1d-e629-488e-a560-a35b545f0ad7'
    const name = 'name-2131'
    nockCF
      .get(`/v2/spaces/${spaceGUID}/apps`)
      .reply(
        200,
        JSON.stringify(
          wrapResources(lodash.merge(defaultApp(), { entity: { name } }))
        )
      )

    const client = new CloudFoundryClient(config)
    const apps = await client.applications(spaceGUID)

    expect(apps.length > 0).toBeTruthy()
    expect(apps[0].entity.name).toEqual(name)
  })

  it('should obtain particular app', async () => {
    const guid = '15b3885d-0351-4b9b-8697-86641668c123'
    const name = 'particular-app'
    nockCF
      .get(`/v2/apps/${guid}`)
      .reply(
        200,
        JSON.stringify(
          lodash.merge(defaultApp(), { entity: { name }, metadata: { guid } })
        )
      )

    const client = new CloudFoundryClient(config)
    const app = await client.application(guid)

    expect(app.entity.name).toEqual(name)
  })

  it('should obtain app summary', async () => {
    nockCF
      .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary')
      .reply(200, data.appSummary)

    const client = new CloudFoundryClient(config)
    const app = await client.applicationSummary(
      'cd897c8c-3171-456d-b5d7-3c87feeabbd1'
    )

    expect(app.name).toEqual('name-79')
  })

  it('should obtain list of services', async () => {
    nockCF
      .get('/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe/service_instances')
      .reply(200, data.services)

    const client = new CloudFoundryClient(config)
    const services = await client.spaceServices(
      'f858c6b3-f6b1-4ae8-81dd-8e8747657fbe'
    )

    expect(services.length > 0).toBeTruthy()
    expect(services[0].entity.name).toEqual('name-2104')
  })

  it('should obtain particular service instance', async () => {
    nockCF
      .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92')
      .reply(200, data.serviceInstance)

    const client = new CloudFoundryClient(config)
    const serviceInstance = await client.serviceInstance(
      '0d632575-bb06-4ea5-bb19-a451a9644d92'
    )

    expect(serviceInstance.entity.name).toEqual('name-1508')
  })

  it('should obtain particular service plan', async () => {
    nockCF
      .get('/v2/service_plans/775d0046-7505-40a4-bfad-ca472485e332')
      .reply(200, data.servicePlan)

    const client = new CloudFoundryClient(config)
    const servicePlan = await client.servicePlan(
      '775d0046-7505-40a4-bfad-ca472485e332'
    )

    expect(servicePlan.entity.name).toEqual('postgres-1573')
  })

  it('should obtain particular service', async () => {
    nockCF
      .get('/v2/services/53f52780-e93c-4af7-a96c-6958311c40e5')
      .reply(200, data.serviceString)

    const client = new CloudFoundryClient(config)
    const service = await client.service(
      '53f52780-e93c-4af7-a96c-6958311c40e5'
    )

    expect(service.entity.label).toEqual('postgres')
  })

  it('should obtain all v2 service plans', async () => {
    nockCF
      .get('/v2/services/53f52780-e93c-4af7-a96c-6958311c40e5/service_plans')
      .reply(200, { resources: [data.servicePlan] })

    const client = new CloudFoundryClient(config)
    const plans = await client.servicePlans(
      '53f52780-e93c-4af7-a96c-6958311c40e5'
    )

    expect(plans).toHaveLength(1)
  })

  it('should obtain all v3 service plans', async () => {
    nockCF
      .get('/v3/service_plans?service_offering_guids=53f52780-e93c-4af7-a96c-6958311c40e5')
      .reply(200, { pagination: { next: null }, resources: [data.servicePlan] })

    const client = new CloudFoundryClient(config)
    const plans = await client.v3ServicePlans(
      '53f52780-e93c-4af7-a96c-6958311c40e5'
    )

    expect(plans).toHaveLength(1)
  })

  it('should obtain v3 service', async () => {
    nockCF
      .get('/v3/service_offerings/53f52780-e93c-4af7-a96c-6958311c40e5')
      .reply(200, { name: 'postgres' })

    const client = new CloudFoundryClient(config)
    const service = await client.v3Service(
      '53f52780-e93c-4af7-a96c-6958311c40e5'
    )

    expect(service).toHaveProperty('name')
  })

  it('should obtain all v3 services', async () => {
    nockCF
      .get('/v3/service_offerings')
      .reply(200, { pagination: { next: null }, resources: [data.serviceObj] })

    const client = new CloudFoundryClient(config)
    const services = await client.services()

    expect(services).toHaveLength(1)
  })

  it('should create a user', async () => {
    nockCF.post('/v2/users').reply(200, data.user)

    const client = new CloudFoundryClient(config)
    const user = await client.createUser(
      'guid-cb24b36d-4656-468e-a50d-b53113ac6177'
    )
    expect(user.metadata.guid).toEqual(
      'guid-cb24b36d-4656-468e-a50d-b53113ac6177'
    )
  })

  it('should delete a user', () => {
    nockCF
      .delete('/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177?async=false')
      .reply(204)

    const client = new CloudFoundryClient(config)
    expect(async () =>
      await client.deleteUser('guid-cb24b36d-4656-468e-a50d-b53113ac6177')
    ).not.toThrowError()
  })

  it('should obtain a user summary', async () => {
    nockCF.get('/v2/users/uaa-id-253/summary').reply(200, data.userSummary)

    const client = new CloudFoundryClient(config)
    const summary = await client.userSummary('uaa-id-253')

    expect(summary.entity.organizations.length === 1).toBeTruthy()
    expect(summary.entity.managed_organizations.length === 1).toBeTruthy()
    expect(
      summary.entity.billing_managed_organizations.length === 1
    ).toBeTruthy()
    expect(summary.entity.audited_organizations.length === 1).toBeTruthy()
  })

  it('should obtain list of user roles for organisation', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, data.userRolesForOrg)

    const client = new CloudFoundryClient(config)
    const users = await client.usersForOrganization(
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275'
    )

    expect(users.length > 0).toBeTruthy()
    expect(users[0].entity.username).toEqual('user@uaa.example.com')
    expect(users[0].entity.organization_roles.length).toEqual(4)
  })

  it('should obtain list of user roles for space', async () => {
    nockCF
      .get('/v2/spaces/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, data.userRolesForSpace)

    const client = new CloudFoundryClient(config)
    const users = await client.usersForSpace(
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275'
    )

    expect(users.length > 0).toBeTruthy()
    expect(users[0].entity.username).toEqual('everything@example.com')
    expect(users[0].entity.space_roles.length).toEqual(3)
  })

  it('should be able to assign a user to an organisation by username', async () => {
    nockCF
      .put(
        '/v2/organizations/guid-cb24b36d-4656-468e-a50d-b53113ac6177/users/uaa-id-236'
      )
      .reply(201, {
        metadata: { guid: 'guid-cb24b36d-4656-468e-a50d-b53113ac6177' }
      })

    const client = new CloudFoundryClient(config)
    const organization = await client.assignUserToOrganization(
      'guid-cb24b36d-4656-468e-a50d-b53113ac6177',
      'uaa-id-236'
    )

    expect(organization.metadata.guid).toEqual(
      'guid-cb24b36d-4656-468e-a50d-b53113ac6177'
    )
  })

  it('should be able to set user org roles', async () => {
    nockCF
      .put(
        '/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/users/uaa-id-236?recursive=true'
      )
      .reply(201, data.userRoles)

    const client = new CloudFoundryClient(config)
    const users = await client.setOrganizationRole(
      'beb082da-25e1-4329-88c9-bea2d809729d',
      'uaa-id-236',
      'users',
      true
    )

    expect(users.entity.name).toEqual('name-1753')
  })

  it('should be able to remove user org roles', async () => {
    nockCF
      .delete(
        '/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/users/uaa-id-236?recursive=true'
      )
      .reply(204, {})

    const client = new CloudFoundryClient(config)
    const roles = await client.setOrganizationRole(
      'beb082da-25e1-4329-88c9-bea2d809729d',
      'uaa-id-236',
      'users',
      false
    )

    expect(Object.keys(roles).length).toEqual(0)
  })

  it('should be able to set user space roles', async () => {
    nockCF
      .put(
        '/v2/spaces/594c1fa9-caed-454b-9ed8-643a093ff91d/developer/uaa-id-381'
      )
      .reply(201, data.userRoles)

    const client = new CloudFoundryClient(config)
    const users = await client.setSpaceRole(
      '594c1fa9-caed-454b-9ed8-643a093ff91d',
      'uaa-id-381',
      'developer',
      true
    )

    expect(users.entity.name).toEqual('name-1753')
  })

  it('should be able to remove user space roles', async () => {
    nockCF
      .delete(
        '/v2/spaces/594c1fa9-caed-454b-9ed8-643a093ff91d/developer/uaa-id-381'
      )
      .reply(204, {})

    const client = new CloudFoundryClient(config)
    const users = await client.setSpaceRole(
      '594c1fa9-caed-454b-9ed8-643a093ff91d',
      'uaa-id-381',
      'developer',
      false
    )

    expect(Object.keys(users).length).toEqual(0)
  })

  it('should obtain list of user roles for organisation and not find logged in user', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, data.userRolesForOrg)

    const client = new CloudFoundryClient(config)
    const hasRole = await client.hasOrganizationRole(
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      'not-existing-user',
      'org_manager'
    )

    expect(hasRole).toBeFalsy()
  })

  it('should obtain list of user provided services', async () => {
    nockCF
      .get(
        '/v2/user_provided_service_instances?q=space_guid:594c1fa9-caed-454b-9ed8-643a093ff91d'
      )
      .reply(200, data.userServices)

    const client = new CloudFoundryClient(config)
    const services = await client.userServices(
      '594c1fa9-caed-454b-9ed8-643a093ff91d'
    )

    expect(services.length > 0).toBeTruthy()
    expect(services[0].entity.name).toEqual('name-1696')
  })

  it('should obtain user provided service', async () => {
    nockCF
      .get(
        '/v2/user_provided_service_instances/e9358711-0ad9-4f2a-b3dc-289d47c17c87'
      )
      .reply(200, data.userServiceInstance)

    const client = new CloudFoundryClient(config)
    const service = await client.userServiceInstance(
      'e9358711-0ad9-4f2a-b3dc-289d47c17c87'
    )

    expect(service.entity.name).toEqual('name-1700')
  })

  it('should obtain list of stacks', async () => {
    nockCF.get('/v2/stacks').reply(200, data.stacks)

    const client = new CloudFoundryClient(config)
    const stacks = await client.stacks()

    expect(stacks.length > 0).toBeTruthy()
    expect(stacks[0].entity.name).toEqual('cflinuxfs2')
    expect(stacks[1].entity.name).toEqual('cflinuxfs3')
  })

  it('should obtain a stack', async () => {
    nockCF
      .get('/v2/stacks/bb9ca94f-b456-4ebd-ab09-eb7987cce728')
      .reply(200, data.stack)

    const client = new CloudFoundryClient(config)
    const stack = await client.stack('bb9ca94f-b456-4ebd-ab09-eb7987cce728')

    expect(stack.entity.name).toEqual('cflinuxfs3')
  })

  it('should get the GUID of cflinuxfs2', async () => {
    nockCF.get('/v2/stacks').reply(200, data.stacks)

    const client = new CloudFoundryClient(config)
    const cflinuxfs2StackGUID = await client.cflinuxfs2StackGUID()

    expect(cflinuxfs2StackGUID).toEqual('dd63d39a-85f8-48ef-bb73-89097192cfcb')
  })

  it('should return undefined when cflinuxfs2 is not present', async () => {
    nock.cleanAll()
    nock('https://example.com/api')
      .get('/v2/stacks')
      .reply(200, data.stacksWithoutCflinuxfs2)

    const client = new CloudFoundryClient(config)
    const cflinuxfs2StackGUID = await client.cflinuxfs2StackGUID()

    expect(cflinuxfs2StackGUID).toEqual(undefined)
  })

  it('should be able to create organisation using v3 api', async () => {
    nockCF.post('/v3/organizations').reply(201, data.v3Organisation)

    const client = new CloudFoundryClient(config)
    const organization = await client.v3CreateOrganization({
      name: 'some-org-name',
      metadata: { annotations: { owner: 'organisation-owner' } }
    })

    expect(organization).toHaveProperty('guid')
    expect(organization.guid).toEqual('ORG_GUID')
  })

  it('should be able to create space using v3 api', async () => {
    nockCF.post('/v3/spaces').reply(201, data.v3Space)

    const client = new CloudFoundryClient(config)
    const space = await client.v3CreateSpace({
      name: 'some-org-name',
      relationships: {
        organization: {
          data: {
            guid: 'ORG_GUID'
          }
        }
      }
    })

    expect(space).toHaveProperty('guid')
    expect(space.guid).toEqual('SPACE_GUID')
  })

  it('should retrieve roles for a user', async () => {
    const orgGUID = 'an-org-guid'
    const spaceGUID = 'a-space-guid'
    const userGUID = 'a-user-guid'

    const roles = [
      orgRole('organization_manager', orgGUID, userGUID),
      spaceRole('space_developer', orgGUID, spaceGUID, userGUID)
    ]

    nockCF
      .get(`/v3/roles?user_guids=${userGUID}`)
      .reply(200, JSON.stringify(wrapV3Resources(...roles)))

    const client = new CloudFoundryClient(config)
    const actualRoles = await client.userRoles(userGUID)

    expect(actualRoles).toEqual(roles)
  })

  it('should retreive organization quotas', async () => {
    const orgQuotas = [
      { guid: 'org-quota-1', name: 'small' },
      { guid: 'org-quota-2', name: 'medium' }
    ]

    nockCF
      .get('/v3/organization_quotas')
      .reply(200, JSON.stringify(wrapV3Resources(...orgQuotas)))

    const client = new CloudFoundryClient(config)
    const quotas = await client.organizationQuotas()

    expect(quotas).toHaveLength(2)
  })

  it('should apply quota to all organizations', async () => {
    nockCF
      .post('/v3/organization_quotas/org-quota-1/relationships/organizations')
      .reply(201, JSON.stringify(wrapV3Resources(...[{ guid: 'org-guid' }])))

    const client = new CloudFoundryClient(config)
    await expect(client.applyOrganizationQuota('org-quota-1', 'org-guid')).resolves.toBeDefined()
  })
})
