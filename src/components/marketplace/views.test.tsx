/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
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
    const { container } = render(<MarketplaceItemPage
      linkTo={linker}
      service={minimalService}
      versions={[]}
      plans={[]}
    />);

    expect(container.querySelector('h1')).toHaveTextContent(minimalService.name);

    expect(container.querySelector('#service-usecase')).toBeFalsy();
    expect(container.querySelector('#service-documentation')).toBeFalsy();
    expect(container.querySelector('#service-tags')).toBeFalsy();
  });

  it('should display the ordinary page as expected', () => {
    const { container } = render(<MarketplaceItemPage
      linkTo={linker}
      service={service}
      versions={[]}
      plans={[]}
    />);

    expect(container.querySelector('h1')).toHaveTextContent(service.name);
    expect(container.querySelectorAll('#service-documentation li')).toHaveLength(1);
  });

  it('should display the fully detailed page as expected', () => {
    const { container } = render(<MarketplaceItemPage
      linkTo={linker}
      service={detailedService}
      versions={['1', '2']}
      plans={plans}
    />);

    expect(container.querySelector('h1')).toHaveTextContent(detailedService.broker_catalog.metadata.displayName);
    expect(container.querySelector('h1')).not.toHaveTextContent(detailedService.name);

    expect(container.querySelector('p')).toHaveTextContent(detailedService.broker_catalog.metadata.longDescription);
    expect(container.querySelector('#service-provider')).toHaveTextContent('Provider');
    expect(container.querySelector('#service-provider')).toHaveTextContent(detailedService.broker_catalog.metadata.providerDisplayName);
    expect(container.querySelector('#service-usecase')).toHaveTextContent('Usecase');
    expect(container.querySelector('#service-usecase li')).toHaveTextContent(detailedService.broker_catalog.metadata.AdditionalMetadata.usecase[0]);
    expect(container.querySelector('#service-documentation')).toHaveTextContent('Documentation');
    expect(container.querySelectorAll('#service-documentation li')).toHaveLength(2);
    expect(container.querySelectorAll('#service-documentation li a')[0])
    .toHaveAttribute('href', expect.stringContaining(detailedService.broker_catalog.metadata.documentationUrl));
    expect(container.querySelectorAll('#service-documentation li a')[1])
    .toHaveAttribute('href', expect.stringContaining(detailedService.broker_catalog.metadata.AdditionalMetadata.otherDocumentation[0]));
    expect(container.querySelector('#service-tags')).toHaveTextContent('Tags');
    expect(container.querySelectorAll('#service-tags li')[0]).toHaveTextContent(detailedService.tags[0]);
  });
});

describe(MarketplacePage, () => {
  it('should parse the page correctly', () => {
    const { container } = render(<MarketplacePage linkTo={linker} services={[ detailedService, minimalService ]} />);

    expect(container.querySelectorAll('ul li')).toHaveLength(2);
    expect(container
      .querySelectorAll('img')[0])
      .toHaveAttribute('src', expect.stringContaining('postgres'));
    expect(container
      .querySelectorAll('img')[0])
      .toHaveAttribute('alt', expect.stringContaining('PostgreSQL - Official Logo'));
    expect(container
      .querySelectorAll('figcaption')[0])
      .toHaveTextContent('AWS RDS Postgres');
    expect(container
      .querySelectorAll('img')[1])
      .toHaveAttribute('src', expect.stringContaining('cloud'));
    expect(container
      .querySelectorAll('img')[1])
      .toHaveAttribute('alt',expect.stringContaining('Missing service logo'));
    expect(container
      .querySelectorAll('figcaption')[1]).toHaveTextContent('test');
  });
});

describe(PlanTab, () => {
  it('should list out fully detailed plans correctly', () => {
    const { container } = render(<PlanTab
      linkTo={linker}
      plans={plans}
      serviceGUID=""
      versions={['1', '2']}
    />);

    expect(container.querySelector('thead tr')).toHaveTextContent('Plan');
    expect(container.querySelector('thead tr')).toHaveTextContent('HA');
    expect(container.querySelector('thead tr')).toHaveTextContent('IOPS');
    expect(container.querySelector('thead tr')).toHaveTextContent('Backups');
    expect(container.querySelector('thead tr')).toHaveTextContent('Encrypted');
    expect(container.querySelector('thead tr')).toHaveTextContent('Connections');
    expect(container.querySelector('thead tr')).toHaveTextContent('Memory');
    expect(container.querySelector('thead tr')).toHaveTextContent('Space');
    expect(container.querySelector('thead tr')).toHaveTextContent('Available in trial');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container.querySelector('tbody tr')).toHaveTextContent('free');
  });

  it('should list out minimal plans correctly', () => {
    const { container } = render(<PlanTab
      linkTo={linker}
      plans={plans.filter(plan => plan.name === 'free')}
      serviceGUID=""
      versions={['1', '2']}
    />);

    expect(container.querySelector('thead tr')).toHaveTextContent('Plan');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('HA');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('IOPS');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('Backups');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('Encrypted');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('Connections');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('Memory');
    expect(container.querySelector('thead tr')).not.toHaveTextContent('Space');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.querySelector('tbody tr')).toHaveTextContent('free');
  });
});

describe(Tab, () => {
  it('should perse a tab correctly', () => {
    render(<Tab active={false} href="https://example.com/">TabName</Tab>);
    expect(screen.queryByText('TabName')).toBeTruthy()
    expect(screen.queryByRole('listitem')).toHaveClass('govuk-tabs__list-item');
    expect(screen.queryByRole('listitem')).not.toHaveClass('govuk-tabs__list-item--selected');
    expect(screen.queryByRole('listitem')).not.toBeEmptyDOMElement();
    expect(screen.queryByRole('link')).toHaveAttribute('href', expect.stringContaining('https://example.com/'));
  });

  it('should perse an active tab correctly', () => {
    render(<Tab active={true} href="https://example.com/">TabName</Tab>);
    expect(screen.queryByText('TabName')).toBeTruthy()
    expect(screen.queryByRole('listitem')).toHaveClass('govuk-tabs__list-item');
    expect(screen.queryByRole('listitem')).toHaveClass('govuk-tabs__list-item--selected');
    expect(screen.queryByRole('link')).toHaveAttribute('href', expect.stringContaining('https://example.com/'));
  });
});
