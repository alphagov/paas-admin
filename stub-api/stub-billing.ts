import express from 'express';

const defaultPriceDetails = {
  name: "default-price-name",
  stop: "2019-01-23T14:42:55+00:00",
  start: "2019-01-22T10:44:05+00:00",
  ex_vat: "0.0224000000000000000000000",
  inc_vat: "0.02688000000000000000000000",
  vat_code: "Standard",
  vat_rate: "0.2",
  plan_name: "app",
  currency_code: "USD",
  currency_rate: "0.8"
};
const defaultBillingEvent = {
      event_guid: "default-event-guid",
      event_start: "2019-01-22T10:44:05+00:00",
      event_stop: "2019-01-23T14:42:55+00:00",
      resource_guid: "default-resource-guid",
      resource_name: "default-resource",
      resource_type: "app",
      org_guid: "some-org-guid",
      org_name: "some-org",
      space_guid: "some-space-guid",
      space_name: "some-space",
      plan_guid: "some-plan-guid",
      quota_definition_guid: null,
      number_of_nodes: 2,
      memory_in_mb: 128,
      storage_in_mb: 0,
      price: {}
    }
function mockBilling(app: express.Application, _config: { stubApiPort: string, adminPort: string }) {
  app.get('/billable_events', (_req, res) => {
    res.send(JSON.stringify([
      {
        ...defaultBillingEvent,
        resource_name: 'up',
        price: {inc_vat: "100.00", ex_vat: "80.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'down',
        price: {inc_vat: "334.00", ex_vat: "314.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'strange',
        price: {inc_vat: "10.00", ex_vat: "8.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'charm',
        price: {inc_vat: "532.00", ex_vat: "512.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'bottom',
        price: {inc_vat: "100.00", ex_vat: "80.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'top',
        price: {inc_vat: "100.00", ex_vat: "80.00", details: [{...defaultPriceDetails, plan_name: "magical-plan"}]}
      },
    ]));
  });
};

export default mockBilling;
