import express from 'express';
import syncHandler from '../app/sync-handler';
import spacesTemplate from './spaces.njk';
import spaceOverviewTemplate from './overview.njk';

const app = express();

function buildURL(route) {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

async function listApplications(client, spaceGUID) {
  const space = await client.space(spaceGUID);
  const applications = await client.applications(spaceGUID);
  const organization = await client.organization(space.entity.organization_guid); // eslint-disable-line camelcase

  space.entity = {...space.entity, ...await client.spaceSummary(space.metadata.guid)};

  await Promise.all(applications.map(async application => {
    application.entity = {...application.entity, ...await client.applicationSummary(application.metadata.guid)};
    application.entity.urls = application.entity.routes.map(buildURL);
  }));

  return {organization, space, applications};
}

async function listSpaces(client, organizationGUID) {
  const spaces = await client.spaces(organizationGUID);
  const organization = await client.organization(organizationGUID);
  const users = await client.usersForOrganization(organizationGUID);
  const managers = users.filter(user =>
    user.entity.organization_roles.some(role => role === 'org_manager')
  );

  organization.entity.quota = await client.organizationQuota(organization.entity.quota_definition_guid); // eslint-disable-line camelcase

  await Promise.all(spaces.map(async space => {
    space.entity = {...space.entity, ...await client.spaceSummary(space.metadata.guid)};

    space.entity.quota = null;
    if ((space.entity.space_quota_definition_guid)) { // eslint-disable-line camelcase
      space.entity.quota = await client.spaceQuota(space.entity.space_quota_definition_guid); // eslint-disable-line camelcase
    }
  }));

  for (const space of spaces) {
    space.entity.running_apps = space.entity.apps.filter(app => app.running_instances > 0); // eslint-disable-line camelcase
    space.entity.stopped_apps = space.entity.apps.filter(app => app.running_instances === 0); // eslint-disable-line camelcase
    space.entity.memory_allocated = space.entity.apps.reduce((allocated, app) => allocated + app.memory, 0); // eslint-disable-line camelcase
  }

  organization.entity.memory_allocated = spaces.reduce((allocated, space) => allocated + space.entity.memory_allocated, 0); // eslint-disable-line camelcase

  return {spaces, organization, users, managers};
}

app.get('/:organization', syncHandler(async (req, res) => {
  const data = await listSpaces(req.cf, req.params.organization);
  res.send(spacesTemplate.render(data));
}));

app.get('/:space/overview', syncHandler(async (req, res) => {
  const data = await listApplications(req.cf, req.params.space);
  res.send(spaceOverviewTemplate.render(data));
}));

export default app;
