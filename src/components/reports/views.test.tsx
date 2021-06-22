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
      created_at: '2020-01-01',
      guid: 'org-guid',
      links: {
        default_domain: {
          href: 'default-domain-link',
        },
        domains: {
          href: 'domain-link',
        },
        self: {
          href: 'self-link',
        },
      },
      metadata: {
        annotations: {
          owner: 'owner',
        },
        labels: {},
      },
      name: 'org-name',
      relationships: {
        quota: {
          data: {
            guid: 'quota-guid',
          },
        },
      },
      suspended: false,
      updated_at: '2020-01-01',
    },
  ];

  const billableOrg = [
    {
      created_at: '2019-12-01',
      guid: 'org-guid',
      links: {
        default_domain: {
          href: 'default-domain-link',
        },
        domains: {
          href: 'domain-link',
        },
        self: {
          href: 'self-link',
        },
      },
      metadata: {
        annotations: {
          owner: 'billable-owner',
        },
        labels: {},
      },
      name: 'org-name',
      relationships: {
        quota: {
          data: {
            guid: 'billable-quota-guid',
          },
        },
      },
      suspended: false,
      updated_at: '2020-01-01',
    },
  ];

  const suspendedOrg = [
    {
      created_at: '2020-01-01',
      guid: 'suspended-guid',
      links: {
        default_domain: {
          href: 'default-domain-link',
        },
        domains: {
          href: 'domain-link',
        },
        self: {
          href: 'self-link',
        },
      },
      metadata: {
        annotations: {
          owner: 'owner',
        },
        labels: {},
      },
      name: 'suspended-org',
      relationships: {
        quota: {
          data: {
            guid: 'quota-guid',
          },
        },
      },
      suspended: true,
      updated_at: '2020-01-01',
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
      created_at: '2020-01-01',
      guid: 'quota-guid',
      updated_at: '2020-01-01',
      url: 'url',
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
      created_at: '2020-01-01',
      guid: 'billable-quota-guid',
      updated_at: '2020-01-01',
      url: 'url',
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
          'billable-quota-guid': billableQuota,
          'quota-guid': orgQuota,
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
    const orgWithNoAnnotations = [{
      ...org[0],
      metadata: {
        annotations: {},
        labels: {},
      },
    }];
    const billableOrgWithNoAnnotations = [{
      ...billableOrg[0],
      metadata: {
        annotations: {},
        labels: {},
      },
    }];

    const markup = shallow(
      <OrganizationsReport
        linkTo={route => `__LINKS_TO__${route}`}
        organizations={orgWithNoAnnotations}
        trialOrgs={orgWithNoAnnotations}
        billableOrgs={billableOrgWithNoAnnotations}
        orgQuotaMapping={{
          'billable-quota-guid': billableQuota,
          'quota-guid': orgQuota,
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
          'billable-quota-guid': billableQuota,
          'quota-guid': orgQuota,
        }}
        orgTrialExpirys={{ 'org-guid': new Date('2019-01-30'), 'suspended-guid': new Date('2019-01-15') }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('table tbody tr td:first-of-type a').attr('aria-label')).toEqual(
      'Organisation name: suspended-org, status: suspended',
    );

    expect($('table tbody tr td:first-of-type span.govuk-tag').length).toEqual(1);
  });
});

describe(CostReport, () => {
  const totalBillables = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
  };

  const orgCostRecords = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
    orgGUID: 'org-guid',
    orgName: 'org-name',
    quotaGUID: 'quota-guid',
    quotaName: 'quota-name',
  };

  const quotaCostRecords = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
    quotaGUID: 'quota-guid',
    quotaName: 'quota-name',
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
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
    serviceGroup: 'service-group',
  };

  const billablesByOrganisationAndService = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
    orgGUID: 'org-guid',
    orgName: 'org-name',
    serviceGroup: 'service-group',
  };

  const billablesByOrganisationAndSpaceAndService = {
    exVAT: 62.97,
    exVATWithAdminFee: 69.267,
    incVAT: 75.56,
    orgGUID: 'org-guid',
    orgName: 'org-name',
    serviceGroup: 'service-group',
    spaceGUID: 'space-guid',
    spaceName: 'space-name',
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
      <VisualisationPage date={'January 2020'} data={undefined} />,
    );

    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('Billing flow for January 2020');
    expect($('h2').text()).toContain('No data for January 2020');
  });
});
