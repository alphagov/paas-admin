import express from 'express';
import syncHandler from '../app/sync-handler';
import applicationOverviewTemplate from './overview.njk';

const app = express();

function buildURL(route) {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

app.get('/:applicationGUID/overview', syncHandler(async (req, res) => {
  const application = await req.cf.application(req.params.applicationGUID);

  application.entity = {...application.entity, ...(await req.cf.applicationSummary(req.params.applicationGUID))};
  application.entity.urls = application.entity.routes.map(buildURL);

  const space = await req.cf.space(application.entity.space_guid);
  const organization = await req.cf.organization(space.entity.organization_guid);

  res.send(applicationOverviewTemplate.render({application, space, organization}));
}));

export default app;
