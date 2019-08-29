import express from 'express';
import {IStubServerPorts} from './index';

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
};
function mockBilling(app: express.Application, _config: IStubServerPorts): express.Application {
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
        price: {inc_vat: "34.00", ex_vat: "14.00", details: [{...defaultPriceDetails, plan_name: "fantastical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'down',
        org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        price: {inc_vat: "334.00", ex_vat: "314.00", details: [{...defaultPriceDetails, plan_name: "fantastical-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'strange',
        price: {inc_vat: "10.00", ex_vat: "8.00", details: [{...defaultPriceDetails, plan_name: "wizardly-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'charm',
        price: {inc_vat: "532.00", ex_vat: "512.00", details: [{...defaultPriceDetails, plan_name: "witching-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'charm',
        org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        price: {inc_vat: "132.00", ex_vat: "112.00", details: [{...defaultPriceDetails, plan_name: "witching-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'bottom',
        org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        price: {inc_vat: "100.00", ex_vat: "80.00", details: [{...defaultPriceDetails, plan_name: "sorcerous-plan"}]}
      },
      {
        ...defaultBillingEvent,
        resource_name: 'top',
        org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        price: {inc_vat: "100.00", ex_vat: "80.00", details: [{...defaultPriceDetails, plan_name: "supernatural-plan"}]}
      },
    ]));
  });
  app.get('/pricing_plans', (_req, res) => {
    res.send(JSON.stringify([
        {
          name: "app",
          plan_guid: "f4d4b95a-f55e-4593-8d54-3364c25798c4",
          valid_from: "2017-01-01T00:00:00+00:00",
          components: [
            {
              name: "instance",
              formula: "ceil($time_in_seconds/3600) * 0.01",
              vat_code: "Standard",
              currency_code: "USD"
            }
          ],
          memory_in_mb: 0,
          storage_in_mb: 524288,
          number_of_nodes: 0
        },
        {
          name: "postgres tiny-9.6",
          plan_guid: "f4d4b95a-f55e-4593-8d54-3364c25798c5",
          valid_from: "2017-01-01T00:00:00+00:00",
          components: [
            {
              "name": "instance",
              "formula": "ceil($time_in_seconds/3600) * 9",
              "currency_code": "USD",
              "vat_code": "Standard"
            },
            {
              "name": "storage",
              "formula": "(($storage_in_mb/1024) * ceil($time_in_seconds/2678401) * 9) * $number_of_nodes",
              "currency_code": "USD",
              "vat_code": "Standard"
            }
          ],
          memory_in_mb: 1024,
          storage_in_mb: 1024,
          number_of_nodes: 4
        },
        {
          name: "postgres massive-9.6",
          plan_guid: "f4d4b95a-f55e-4593-8d54-3364c25798a5",
          valid_from: "2017-01-01T00:00:00+00:00",
          components: [
            {
              "name": "instance",
              "formula": "ceil($time_in_seconds/3600) * 999999",
              "currency_code": "USD",
              "vat_code": "Standard"
            },
            {
              "name": "storage",
              "formula": "(($storage_in_mb/1024) * ceil($time_in_seconds/2678401) * 99999) * $number_of_nodes",
              "currency_code": "USD",
              "vat_code": "Standard"
            }
          ],
          memory_in_mb: 1024,
          storage_in_mb: 1024,
          number_of_nodes: 4
        }
    ]))
  });
  app.get('/forecast_events', (_req, res) => {
    res.send(JSON.stringify([{
      event_guid: "aa30fa3c-725d-4272-9052-c7186d4968a6",
      event_start: "2001-01-01T00:00:00+00:00",
      event_stop: "2001-01-01T01:00:00+00:00",
      resource_guid: "c85e98f0-6d1b-4f45-9368-ea58263165a0",
      resource_name: "APP1",
      resource_type: "_TESTING_APPLICATION_",
      org_guid: "51ba75ef-edc0-47ad-a633-a8f6e8770944",
      space_guid: "276f4886-ac40-492d-a8cd-b2646637ba76",
      plan_guid: "f4d4b95a-f55e-4593-8d54-3364c25798c4",
      number_of_nodes: 1,
      memory_in_mb: 1024,
      storage_in_mb: 0,
      price: {
        inc_vat: "0.012",
        ex_vat: "0.01",
        details: [
          {
            name: "compute",
            plan_name: "PLAN1",
            start: "2001-01-01T00:00:00+00:00",
            stop: "2001-01-01T01:00:00+00:00",
            vat_rate: "0.2",
            vat_code: "Standard",
            currency_code: "GBP",
            currency_rate: "1",
              inc_vat: "0.012",
              ex_vat: "0.01"
            }
          ]
        }
      }]))
  });
  app.get('/currency_rates', (_req, res) => {
    res.send(JSON.stringify([{
      code: "GBP",
      valid_from: "2001-01-01T00:00:00+00:00",
      rate: 1.0,
    }, {
      code: "USD",
      valid_from: "2001-01-01T00:00:00+00:00",
      rate: 0.8,
    }]))
  });
  app.get('/vat_rates', (_req, res) => {
    res.send(JSON.stringify([{
      code: "Standard",
      valid_from: "2001-01-01T00:00:00+00:00",
      rate: 0.2,
    }, {
      code: "Reduced",
      valid_from: "2001-01-01T00:00:00+00:00",
      rate: 0.05,
    }, {
      code: "Zero",
      valid_from: "2001-01-01T00:00:00+00:00",
      rate: 0.0,
    }]))
  });

  return app;
};

export default mockBilling;
