import express from 'express';
import syncHandler from '../app/sync-handler';
import serviceOverviewTemplate from './overview.njk';

const app = express();

app.get('/:serviceGUID/overview', syncHandler(async (req, res) => {
  const service = await req.cf.serviceInstance(req.params.serviceGUID);
  service.service_plan = await req.cf.servicePlan(service.entity.service_plan_guid); // eslint-disable-line camelcase
  service.service_plan.service = await req.cf.service(service.service_plan.entity.service_guid); // eslint-disable-line camelcase

  const space = await req.cf.space(service.entity.space_guid);
  const organization = await req.cf.organization(space.entity.organization_guid);

  res.send(serviceOverviewTemplate.render({service, space, organization}));
}));

export default app;
