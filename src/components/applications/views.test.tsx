/**
 * @jest-environment jsdom
 */
 import { render, screen } from '@testing-library/react';
 import React from 'react';

import { IApplication } from '../../lib/cf/types';

import { ApplicationTab, AppLink } from './views';

describe(ApplicationTab, () => {
  it('should produce path of items', () => {
    const application = ({
      entity: { name: 'test-app' },
      metadata: { guid: 'APPLICATION_GUID' },
    } as unknown) as IApplication;
    const { container } = render(
      <ApplicationTab
        application={application}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
      >
        <p>TEST</p>
      </ApplicationTab>,
    );
    expect(container.querySelector('h1')).toHaveTextContent('test-app');
    expect(container.querySelector('section.govuk-tabs__panel')).toHaveTextContent('TEST');
    expect(container.querySelector('ul li:first-of-type a')).toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.applications.view'));
    expect(container.querySelector('ul li:first-of-type')).not.toHaveClass('govuk-tabs__list-item--selected');
    expect(container.querySelector('ul li:last-of-type a')).toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.applications.events.view'));
    expect(container.querySelector('ul li:last-of-type')).toHaveClass('govuk-tabs__list-item--selected');
  });
});

describe(AppLink, () => {
  const external = 'https://example.com';
  const internal = 'example.apps.internal';

  it('should resolve with a link', () => {
    render(<AppLink href={external} />);
    expect(screen.getByRole('link')).toBeTruthy();
    expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining(external));
  });

  it('should resolve with a text only', () => {
    render(<AppLink href={internal} />);
    expect(screen.getByText(internal)).not.toHaveAttribute('href');
  });
});
