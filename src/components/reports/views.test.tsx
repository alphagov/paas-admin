import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import {
  CostByServiceReport,
  CostReport,
  OrganizationsReport,
  VisualisationPage,
} from './views';

describe(OrganizationsReport, () => {
  const org = [
    {
      guid: 'org-guid',
      created_at: '2020-01-01',
      updated_at: '2020-01-01',
      name: 'org-name',
      suspended: false,
      relationships: {
        quota: {
          data: {
            guid: 'quota-guid',
          },
        },
      },
      links: {
        self: {
          href: 'self-link',
        },
        domains: {
          href: 'domain-link',
        },
        default_domain: {
          href: 'default-domain-link',
        },
      },
      metadata: {
        labels: {},
        annotations: {
          owner: 'owner',
        },
      },
    },
  ];

  const billableOrg = [
    {
      guid: 'org-guid',
      created_at: '2019-12-01',
      updated_at: '2020-01-01',
      name: 'org-name',
      suspended: false,
      relationships: {
        quota: {
          data: {
            guid: 'billable-quota-guid',
          },
        },
      },
      links: {
        self: {
          href: 'self-link',
        },
        domains: {
          href: 'domain-link',
        },
        default_domain: {
          href: 'default-domain-link',
        },
      },
      metadata: {
        labels: {},
        annotations: {
          owner: 'billable-owner',
        },
      },
    },
  ];

  const suspendedOrg = [
    {
      guid: 'suspended-guid',
      created_at: '2020-01-01',
      updated_at: '2020-01-01',
      name: 'suspended-org',
      suspended: true,
      relationships: {
        quota: {
          data: {
            guid: 'quota-guid',
          },
        },
      },
      links: {
        self: {
          href: 'self-link',
        },
        domains: {
          href: 'domain-link',
        },
        default_domain: {
          href: 'default-domain-link',
        },
      },
      metadata: {
        labels: {},
        annotations: {
          owner: 'owner',
        },
      },
    },
  ];

  const orgQuota = {
    entity: {
      app_instance_limit: 1,
      app_task_limit: 1,
      instance_memory_limit: 1,
      memory_limit: 1,
      name: 'quota-name',
      non_basic_services_allowed: false,
      total_private_domains: 1,
      total_reserved_route_ports: 0,
      total_routes: 1,
      total_service_keys: 1,
      total_services: 1,
      trial_db_allowed: false,
    },
    metadata: {
      guid: 'quota-guid',
      url: 'url',
      created_at: '2020-01-01',
      updated_at: '2020-01-01',
    },
  };

  const billableQuota = {
    entity: {
      app_instance_limit: 1,
      app_task_limit: 1,
      instance_memory_limit: 1,
      memory_limit: 1,
      name: 'billable-quota-name',
      non_basic_services_allowed: false,
      total_private_domains: 1,
      total_reserved_route_ports: 0,
      total_routes: 1,
      total_service_keys: 1,
      total_services: 1,
      trial_db_allowed: false,
    },
    metadata: {
      guid: 'billable-quota-guid',
      url: 'url',
      created_at: '2020-01-01',
      updated_at: '2020-01-01',
    },
  };

  it('should parse the organizations report', () => {
    const markup = shallow(
      <OrganizationsReport
        linkTo={route => `__LINKS_TO__${route}`}
        organizations={org}
        trialOrgs={org}
        billableOrgs={billableOrg}
        orgQuotaMapping={{
          'quota-guid': orgQuota,
          'billable-quota-guid': billableQuota,
        }}
        orgTrialExpirys={{ 'org-guid': new Date('2019-01-30') }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('.govuk-body').text()).toContain('There is 1 organisation');
    expect($('td').text()).toContain('owner');
    expect($('td').text()).toContain('quota-name');
    expect($('td').text()).toContain('January 1st 2020');
    expect($('td').text()).toContain('Expired');
    expect($('td').text()).toContain('billable-owner');
    expect($('td').text()).toContain('December 1st 2019');
  });

  it('should parse the organizations report with owner undefined', () => {
    org[0].metadata.annotations.owner = undefined;
    billableOrg[0].metadata.annotations.owner = undefined;
    const markup = shallow(
      <OrganizationsReport
        linkTo={route => `__LINKS_TO__${route}`}
        organizations={org}
        trialOrgs={org}
        billableOrgs={billableOrg}
        orgQuotaMapping={{
          'quota-guid': orgQuota,
          'billable-quota-guid': billableQuota,
        }}
        orgTrialExpirys={{ 'org-guid': new Date('2019-01-30') }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('td').text()).toContain('Unknown');
  });

  it('should highlight suspended organizations', () => {
    const markup = shallow(
      <OrganizationsReport
        linkTo={route => `__LINKS_TO__${route}`}
        organizations={suspendedOrg}
        trialOrgs={suspendedOrg}
        billableOrgs={billableOrg}
        orgQuotaMapping={{
          'quota-guid': orgQuota,
          'billable-quota-guid': billableQuota,
        }}
        orgTrialExpirys={{ 'org-guid': new Date('2019-01-30') }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('table tbody tr td:first-of-type a').attr('aria-label')).toEqual(
      'Organisation name: suspended-org, status: suspended',
    );

    expect($('table tbody tr td:first-of-type span.govuk-tag').length).toEqual(1);
  })
});

describe(CostReport, () => {
  const totalBillables = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
  };

  const orgCostRecords = {
    orgGUID: 'org-guid',
    orgName: 'org-name',
    quotaGUID: 'quota-guid',
    quotaName: 'quota-name',
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
  };

  const quotaCostRecords = {
    quotaGUID: 'quota-guid',
    quotaName: 'quota-name',
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
  };

  it('should parse the cost report', () => {
    const markup = shallow(
      <CostReport
        date={'January 2020'}
        billableEventCount={2}
        totalBillables={totalBillables}
        orgCostRecords={[orgCostRecords]}
        quotaCostRecords={[quotaCostRecords]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('h2').text()).toContain('2 Billable events');
    expect($('h2').text()).toContain('75.56 Total including VAT');
    expect($('h2').text()).toContain('62.97 Total excluding VAT');
    expect($('h2').text()).toContain('69.27 Total excluding VAT including fee');
    expect($('h1').text()).toContain(
      'Billables by organisation for January 2020',
    );
    expect($('h1').text()).toContain('Billables by quota for January 2020');
    expect($('th').text()).toContain('org-name');
    expect($('td').text()).toContain('75.56');
    expect($('td').text()).toContain('62.97');
    expect($('td').text()).toContain('69.27');
    expect($('th').text()).toContain('quota-name');
    expect($('td').text()).toContain('75.56');
    expect($('td').text()).toContain('62.97');
    expect($('td').text()).toContain('69.27');
  });
});

describe(CostByServiceReport, () => {
  const billablesByService = {
    serviceGroup: 'service-group',
    incVAT: 75.56,
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
  };

  const billablesByOrganisationAndService = {
    orgGUID: 'org-guid',
    orgName: 'org-name',
    serviceGroup: 'service-group',
    incVAT: 75.56,
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
  };

  const billablesByOrganisationAndSpaceAndService = {
    spaceGUID: 'space-guid',
    spaceName: 'space-name',
    orgGUID: 'org-guid',
    orgName: 'org-name',
    serviceGroup: 'service-group',
    incVAT: 75.56,
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
  };

  it('should parse the cost by service report', () => {
    const markup = shallow(
      <CostByServiceReport
        date={'January 2020'}
        billablesByService={[billablesByService]}
        billablesByOrganisationAndService={[billablesByOrganisationAndService]}
        billablesByOrganisationAndSpaceAndService={[
          billablesByOrganisationAndSpaceAndService,
        ]}
      />,
    );

    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('Billables by service for January 2020');
    expect($('h1').text()).toContain(
      'Billables by organisation and service for January 2020',
    );
    expect($('h1').text()).toContain(
      'Billables by organisation and space and service for January 2020',
    );
    expect($('td').text()).toContain('service-group');
    expect($('td').text()).toContain('75.56');
    expect($('td').text()).toContain('62.97');
    expect($('td').text()).toContain('69.27');
    expect($('td').text()).toContain('org-name');
    expect($('td').text()).toContain('space-name');
  });
});

describe(VisualisationPage, () => {
  const data = {
    links: [
      {
        source: 1,
        target: 1,
        value: 1,
      },
    ],
    nodes: [
      {
        name: 'node',
      },
    ],
  };

  it('should parse visualisation with data', () => {
    const markup = shallow(
      <VisualisationPage date={'January 2020'} data={data} />,
    );

    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('Billing flow for January 2020');
  });

  it('should parse visualisation with no data', () => {
    const markup = shallow(
      <VisualisationPage date={'January 2020'} data={null} />,
    );

    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('Billing flow for January 2020');
    expect($('h2').text()).toContain('No data for January 2020');
  });
});
