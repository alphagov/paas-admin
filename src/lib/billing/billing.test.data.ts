export const billableEvents = `[{
        "resource_guid": "e0a488d0-6f1d-4d01-8ad6-725422405250",
        "resource_name": "alfred",
        "resource_type": "postgres",
        "org_guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275",
	"org_name": "admin",
        "space_guid": "5489e195-c42b-4e61-bf30-323c331ecc01",
	"space_name": "real-hero",
	"component_name": "component",
        "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
	"plan_name": "staging",
        "org_quota_definition_guid": "3f2dd80c-7dfb-4e7f-b8a9-406b0b8abfa3",
        "charge_gbp_exc_vat": "0.02",
        "charge_gbp_inc_vat": "0.024",
	"charge_usd_exc_vat": "0.015"
        },
	{
        "resource_guid": "537594b7-b76a-4f5a-941b-675d0297abf8",
        "resource_name": "batman",
        "resource_type": "app",
        "org_guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275",
	"org_name": "admin",
        "space_guid": "bc8d3381-390d-4bd7-8c71-25309900a2e3",
	"space_name": "pretty-face",
	"component_name": "component",
        "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
	"plan_name": "staging",
        "org_quota_definition_guid": "3f2dd80c-7dfb-4e7f-b8a9-406b0b8abfa3",
        "charge_gbp_exc_vat": "0.02",
        "charge_gbp_inc_vat": "0.024",
	"charge_usd_exc_vat": "0.015"
        },
{
        "resource_guid": "029e0254-5307-4628-815a-2b8f4eb2d8fa",
        "resource_name": "robin",
        "resource_type": "app",
        "org_guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275",
	"org_name": "admin",
        "space_guid": "bc8d3381-390d-4bd7-8c71-25309900a2e3",
	"space_name": "pretty-face",
	"component_name": "component",
        "plan_guid": "eaa243f8-2ae6-47eb-8ee7-5a457a308c68",
	"plan_name": "app",
        "org_quota_definition_guid": "3f2dd80c-7dfb-4e7f-b8a9-406b0b8abfa3",
        "charge_gbp_exc_vat": "0.021",
        "charge_gbp_inc_vat": "0.025",
	"charge_usd_exc_vat": "0.015"
        }
]`;

export const currencyRates = `[
  {"code": "GBP", "rate": 1.0, "valid_from": "2017-01-01"},
  {"code": "USD", "rate": 0.8, "valid_from": "2017-01-01"},
  {"code": "USD", "rate": 0.9, "valid_from": "2018-06-01"}
]`;
