/* eslint-disable @typescript-eslint/no-explicit-any */
import { shallow } from 'enzyme';
import React from 'react';

import { IV3Service, IV3ServicePlan } from '../../lib/cf/types';
import { IParameters } from '../../lib/router';

import { MarketplaceItemPage, MarketplacePage, PlanTab, Tab } from './views';

const linker = (route: string, params?: IParameters): string =>
  `__LINKS_TO_${route}_WITH_${new URLSearchParams(params)}`;

const detailedService = {
  broker_catalog: {
    metadata: {
      AdditionalMetadata: {
        otherDocumentation: ['https://example.com/docs/2'],
        usecase: ['testing use'],
      },
      displayName: 'AWS RDS Postgres',
      documentationUrl: 'https://example.com/docs/1',
      longDescription: 'just the service description',
      providerDisplayName: 'jest',
    },
  },
  name: 'postgres',
  tags: ['tag 1'],
} as unknown as IV3Service<any>;

const service = {
  broker_catalog: {
    metadata: {
      costs: [],
      documentationUrl: 'https://example.com/docs/1',
    },
  },
  name: 'ordinary',
  tags: [],
} as unknown as IV3Service<any>;

const minimalService = {
  broker_catalog: {
    metadata: {},
  },
  name: 'test',
  tags: [],
} as unknown as IV3Service<any>;

const plans = [
  {
    free: true,
    broker_catalog: {
      metadata: {},
    },
    name: 'free',
  },
  {
    free: false,
    broker_catalog: {
      metadata: {
        AdditionalMetadata: {
          backups: true,
          concurrentConnections: true,
          encrypted: true,
          highIOPS: true,
          highlyAvailable: true,
          memory: { amount: 2, unit: 'GB' },
          storage: { amount: 2, unit: 'GB' },
          trial: true,
          version: 1,
        },
        costs: [{ amount: { usd: 0.2 }, unit: 'HOUR' }],
        displayName: 'Tiny',
      },
    },
    name: 'tiny',
  },
] as unknown as ReadonlyArray<IV3ServicePlan<any>>;

describe(MarketplaceItemPage, () => {
  it('should display the minimal page as expected', () => {
    const markup = shallow(<MarketplaceItemPage
      linkTo={linker}
      service={minimalService}
      versions={[]}
      plans={[]}
    />);

    expect(markup.find('h1').text()).toContain(minimalService.name);

    expect(markup.find('#service-usecase')).toHaveLength(0);
    expect(markup.find('#service-documentation')).toHaveLength(0);
    expect(markup.find('#service-tags')).toHaveLength(0);
  });

  it('should display the ordinary page as expected', () => {
    const markup = shallow(<MarketplaceItemPage
      linkTo={linker}
      service={service}
      versions={[]}
      plans={[]}
    />);

    expect(markup.find('h1').text()).toContain(service.name);
    expect(markup.find('#service-documentation li')).toHaveLength(1);
  });

  it('should display the fully detailed page as expected', () => {
    const markup = shallow(<MarketplaceItemPage
      linkTo={linker}
      service={detailedService}
      versions={['1', '2']}
      plans={plans}
    />);

    expect(markup.find('h1').text()).toContain(detailedService.broker_catalog.metadata.displayName);
    expect(markup.find('h1').text()).not.toContain(detailedService.name);

    expect(markup.find('p').text()).toContain(detailedService.broker_catalog.metadata.longDescription);
    expect(markup.find('#service-provider').text()).toContain('Provider');
    expect(markup.find('#service-provider').text())
      .toContain(detailedService.broker_catalog.metadata.providerDisplayName);
    expect(markup.find('#service-usecase').text()).toContain('Usecase');
    expect(markup.find('#service-usecase li').text())
      .toContain(detailedService.broker_catalog.metadata.AdditionalMetadata.usecase[0]);
    expect(markup.find('#service-documentation').text()).toContain('Documentation');
    expect(markup.find('#service-documentation li')).toHaveLength(2);
    expect(markup.find('#service-documentation li a').at(0).prop('href'))
      .toContain(detailedService.broker_catalog.metadata.documentationUrl);
    expect(markup.find('#service-documentation li a').at(1).prop('href'))
      .toContain(detailedService.broker_catalog.metadata.AdditionalMetadata.otherDocumentation[0]);
    expect(markup.find('#service-tags').text()).toContain('Tags');
    expect(markup.find('#service-tags li').at(0).text()).toContain(detailedService.tags[0]);
  });
});

describe(MarketplacePage, () => {
  it('should parse the page correctly', () => {
    const markup = shallow(<MarketplacePage linkTo={linker} services={[ detailedService, minimalService ]} />);
    const render = markup.render();

    expect(markup.find('ul li')).toHaveLength(2);

    expect(render.find('ul li:first-of-type figure').find('img').prop('src')).toContain('postgres');
    expect(render.find('ul li:first-of-type figure').find('img').prop('alt')).toEqual('PostgreSQL - Official Logo');
    expect(render.find('ul li:first-of-type figure').find('figcaption').text()).toEqual('AWS RDS Postgres');

    expect(render.find('ul li:last-of-type figure').find('img').prop('src')).toContain('cloud');
    expect(render.find('ul li:last-of-type figure').find('img').prop('alt')).toEqual('Missing service logo');
    expect(render.find('ul li:last-of-type figure').find('figcaption').text()).toEqual('test');
  });
});

describe(PlanTab, () => {
  it('should list out fully detailed plans correctly', () => {
    const render = shallow(<PlanTab
      linkTo={linker}
      plans={plans}
      serviceGUID=""
      versions={['1', '2']}
    />).render();

    expect(render.find('thead tr').text()).toContain('Plan');
    expect(render.find('thead tr').text()).toContain('HA');
    expect(render.find('thead tr').text()).toContain('IOPS');
    expect(render.find('thead tr').text()).toContain('Backups');
    expect(render.find('thead tr').text()).toContain('Encrypted');
    expect(render.find('thead tr').text()).toContain('Connections');
    expect(render.find('thead tr').text()).toContain('Memory');
    expect(render.find('thead tr').text()).toContain('Space');
    expect(render.find('thead tr').text()).toContain('Available in trial');

    expect(render.find('tbody tr')).toHaveLength(2);
    expect(render.find('tbody tr').text()).toContain('free');
  });

  it('should list out minimal plans correctly', () => {
    const render = shallow(<PlanTab
      linkTo={linker}
      plans={plans.filter(plan => plan.name === 'free')}
      serviceGUID=""
      versions={['1', '2']}
    />).render();

    expect(render.find('thead tr').text()).toContain('Plan');
    expect(render.find('thead tr').text()).not.toContain('HA');
    expect(render.find('thead tr').text()).not.toContain('IOPS');
    expect(render.find('thead tr').text()).not.toContain('Backups');
    expect(render.find('thead tr').text()).not.toContain('Encrypted');
    expect(render.find('thead tr').text()).not.toContain('Connections');
    expect(render.find('thead tr').text()).not.toContain('Memory');
    expect(render.find('thead tr').text()).not.toContain('Space');

    expect(render.find('tbody tr')).toHaveLength(1);
    expect(render.find('tbody tr').text()).toContain('free');
  });
});

describe(Tab, () => {
  it('should perse a tab correctly', () => {
    const markup = shallow(<Tab active={false} href="https://example.com/">TabName</Tab>);

    expect(markup.text()).toEqual('TabName');
    expect(markup.hasClass('govuk-tabs__list-item')).toBe(true);
    expect(markup.hasClass('govuk-tabs__list-item--selected')).toBe(false);
    expect(markup).not.toContain('');
    expect(markup.find('a').prop('href')).toEqual('https://example.com/');
  });

  it('should perse an active tab correctly', () => {
    const markup = shallow(<Tab active={true} href="https://example.com/">TabName</Tab>);

    expect(markup.text()).toEqual('TabName');
    expect(markup.hasClass('govuk-tabs__list-item')).toBe(true);
    expect(markup.hasClass('govuk-tabs__list-item--selected')).toBe(true);
    expect(markup.find('a').prop('href')).toEqual('https://example.com/');
  });
});
