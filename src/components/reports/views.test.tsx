/**
 * @jest-environment jsdom
 */
 import { render, screen, within } from '@testing-library/react';
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
    render(
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
    expect(screen.findAllByText('There is 1 organisation')).toBeTruthy();
    expect(screen.findAllByText('owner')).toBeTruthy();
    expect(screen.findAllByText('quota-name')).toBeTruthy();
    expect(screen.findAllByText('January 1st 2020')).toBeTruthy();
    expect(screen.findAllByText('Expired')).toBeTruthy();
    expect(screen.findAllByText('billable-owner')).toBeTruthy();
    expect(screen.findAllByText('December 1st 2019')).toBeTruthy();
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
    render (
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
    expect(screen.findAllByText('Unkown')).toBeTruthy();
  });

  it('should highlight suspended organizations', () => {
    render(
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

    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByRole('link')).toHaveAttribute('aria-label', expect.stringContaining('Organisation name: suspended-org, status: suspended'));
    expect(within(table).getByText('Suspended')).toBeTruthy();
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
    render(
      <CostReport
        date={'January 2020'}
        billableEventCount={2}
        totalBillables={totalBillables}
        orgCostRecords={[orgCostRecords]}
        quotaCostRecords={[quotaCostRecords]}
      />,
    );
    expect(screen.getAllByRole('heading', {level: 2})[0]).toHaveTextContent('2 Billable events');
    expect(screen.getAllByRole('heading', {level: 2})[1]).toHaveTextContent('75.56 Total including VAT');
    expect(screen.getAllByRole('heading', {level: 2})[2]).toHaveTextContent('62.97 Total excluding VAT');
    expect(screen.getAllByRole('heading', {level: 2})[3]).toHaveTextContent('69.27 Total excluding VAT including fee');
    expect(screen.getAllByRole('heading', {level: 1})[1]).toHaveTextContent('Billables by organisation for January 2020');
    expect(screen.getAllByRole('heading', {level: 1})[2]).toHaveTextContent('Billables by quota for January 2020');
    expect(screen.getAllByText('org-name')).toBeTruthy();
    expect(screen.getAllByText('£75.56')[0]).toBeTruthy();
    expect(screen.getAllByText('£62.97')[0]).toBeTruthy();
    expect(screen.getAllByText('£69.27')[0]).toBeTruthy();
    expect(screen.getAllByText('quota-name')).toBeTruthy();
    expect(screen.getAllByText('£75.56')[1]).toBeTruthy();
    expect(screen.getAllByText('£62.97')[1]).toBeTruthy();
    expect(screen.getAllByText('£69.27')[1]).toBeTruthy();
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
    render(
      <CostByServiceReport
        date={'January 2020'}
        billablesByService={[billablesByService]}
        billablesByOrganisationAndService={[billablesByOrganisationAndService]}
        billablesByOrganisationAndSpaceAndService={[
          billablesByOrganisationAndSpaceAndService,
        ]}
      />,
    );
    expect(screen.getAllByRole('heading', {level: 1})[0]).toHaveTextContent('Billables by service for January 2020');
    expect(screen.getAllByRole('heading', {level: 1})[1]).toHaveTextContent('Billables by organisation and service for January 2020');
    expect(screen.getAllByRole('heading', {level: 1})[2]).toHaveTextContent('Billables by organisation and space and service for January 2020');
    expect(screen.getAllByText('service-group')).toBeTruthy();
    expect(screen.getAllByText('£75.56')[0]).toBeTruthy();
    expect(screen.getAllByText('£62.97')[0]).toBeTruthy();
    expect(screen.getAllByText('£69.27')[0]).toBeTruthy();
    expect(screen.getAllByText('space-name')).toBeTruthy();
    expect(screen.getAllByText('£75.56')[1]).toBeTruthy();
    expect(screen.getAllByText('£62.97')[1]).toBeTruthy();
    expect(screen.getAllByText('£69.27')[1]).toBeTruthy();
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
    render(
      <VisualisationPage date={'January 2020'} data={data} />,
    );

    expect(screen.getAllByRole('heading', {level: 1})[0]).toHaveTextContent('Billing flow for January 2020');
  });

  it('should parse visualisation with no data', () => {
    render(
      <VisualisationPage date={'January 2020'} data={undefined} />,
    );

    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Billing flow for January 2020');
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('No data for January 2020');
  });
});
