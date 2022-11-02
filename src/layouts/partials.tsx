import React, { Fragment, ReactElement } from 'react';

interface IHeaderProperties {
  readonly authenticated?: boolean;
  readonly assetPath?: string;
  readonly location: string;
  readonly isPlatformAdmin: boolean;
}

interface IMainProperties {
  readonly classess?: ReadonlyArray<string>;

  readonly contentStart?: ReactElement;
  readonly contentEnd?: ReactElement;
  readonly language?: string;

  readonly children: ReactElement;
}

interface ISubNavigationItem {
  readonly text: string;
  readonly link: string;
  readonly active?: boolean;
}

export interface ISubNavigationProperties {
  readonly title?: string;
  readonly items: ReadonlyArray<ISubNavigationItem>;
}

interface ICommandLineAlternativeProperties {
  readonly children: string;
  readonly context?: string;
}

interface IFooterProperties {
  readonly authenticated?: boolean;
}

export function Header(props: IHeaderProperties): ReactElement {
  const platformLink = (
    <li className="govuk-header__navigation-item admin">
      <a className="govuk-header__link" href="/platform-admin">
        Admin
      </a>
    </li>
  );

  const assetPath = props.assetPath || '/assets';

  return (
    <header className="govuk-header" role="banner" data-module="govuk-header">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <a
            href="/"
            className="govuk-header__link govuk-header__link--homepage"
          >
            <span className="govuk-header__logotype">
              <svg
                aria-hidden="true"
                focusable="false"
                className="govuk-header__logotype-crown"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 132 97"
                height="30"
                width="36"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9zM4.4 57.2c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.5-1.5-7.6.3-9.1 3.8-1.4 3.5.3 7.6 3.9 9.1zm38.3-21.4c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.6-1.5-7.6.3-9.1 3.8-1.3 3.6.4 7.7 3.9 9.1zm64.4-5.6c-3.6 1.5-7.8-.2-9.1-3.7-1.5-3.6.2-7.8 3.8-9.2 3.6-1.4 7.7.3 9.2 3.9 1.3 3.5-.4 7.5-3.9 9zm15.9 9.3c-3.6 1.5-7.7-.2-9.1-3.7-1.5-3.6.2-7.8 3.7-9.1 3.6-1.5 7.7.2 9.2 3.8 1.5 3.5-.3 7.5-3.8 9zm4.7 17.7c-3.6 1.5-7.8-.2-9.2-3.8-1.5-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.3 3.5-.4 7.6-3.9 9.1zM89.3 35.8c-3.6 1.5-7.8-.2-9.2-3.8-1.4-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.4 3.6-.3 7.7-3.9 9.1zM69.7 17.7l8.9 4.7V9.3l-8.9 2.8c-.2-.3-.5-.6-.9-.9L72.4 0H59.6l3.5 11.2c-.3.3-.6.5-.9.9l-8.8-2.8v13.1l8.8-4.7c.3.3.6.7.9.9l-5 15.4v.1c-.2.8-.4 1.6-.4 2.4 0 4.1 3.1 7.5 7 8.1h.2c.3 0 .7.1 1 .1.4 0 .7 0 1-.1h.2c4-.6 7.1-4.1 7.1-8.1 0-.8-.1-1.7-.4-2.4V34l-5.1-15.4c.4-.2.7-.6 1-.9zM66 92.8c16.9 0 32.8 1.1 47.1 3.2 4-16.9 8.9-26.7 14-33.5l-9.6-3.4c1 4.9 1.1 7.2 0 10.2-1.5-1.4-3-4.3-4.2-8.7L108.6 76c2.8-2 5-3.2 7.5-3.3-4.4 9.4-10 11.9-13.6 11.2-4.3-.8-6.3-4.6-5.6-7.9 1-4.7 5.7-5.9 8-.5 4.3-8.7-3-11.4-7.6-8.8 7.1-7.2 7.9-13.5 2.1-21.1-8 6.1-8.1 12.3-4.5 20.8-4.7-5.4-12.1-2.5-9.5 6.2 3.4-5.2 7.9-2 7.2 3.1-.6 4.3-6.4 7.8-13.5 7.2-10.3-.9-10.9-8-11.2-13.8 2.5-.5 7.1 1.8 11 7.3L80.2 60c-4.1 4.4-8 5.3-12.3 5.4 1.4-4.4 8-11.6 8-11.6H55.5s6.4 7.2 7.9 11.6c-4.2-.1-8-1-12.3-5.4l1.4 16.4c3.9-5.5 8.5-7.7 10.9-7.3-.3 5.8-.9 12.8-11.1 13.8-7.2.6-12.9-2.9-13.5-7.2-.7-5 3.8-8.3 7.1-3.1 2.7-8.7-4.6-11.6-9.4-6.2 3.7-8.5 3.6-14.7-4.6-20.8-5.8 7.6-5 13.9 2.2 21.1-4.7-2.6-11.9.1-7.7 8.8 2.3-5.5 7.1-4.2 8.1.5.7 3.3-1.3 7.1-5.7 7.9-3.5.7-9-1.8-13.5-11.2 2.5.1 4.7 1.3 7.5 3.3l-4.7-15.4c-1.2 4.4-2.7 7.2-4.3 8.7-1.1-3-.9-5.3 0-10.2l-9.5 3.4c5 6.9 9.9 16.7 14 33.5 14.8-2.1 30.8-3.2 47.7-3.2z"
                ></path>
                <image
                  src={`${assetPath}/images/govuk-logotype-crown.png`}
                  className="govuk-header__logotype-crown-fallback-image"
                ></image>
              </svg>{' '}
              <span className="govuk-header__logotype-text">GOV.UK</span>
            </span>{' '}
            <span className="govuk-header__product-name">
              Platform as a Service
            </span>
          </a>
        </div>
        <div className="govuk-header__content govuk-!-display-none-print">
          <nav 
            aria-label="Top Level Navigation" 
            className="govuk-header__navigation"
            >
            <button
              type="button"
              hidden
              className="govuk-header__menu-button govuk-js-header-toggle"
              aria-controls="navigation"
              aria-label="Show or hide Top Level Navigation Menu"
            >
              Menu
            </button>
            <ul
              id="navigation"
              className="govuk-header__navigation-list"
            >
              <li className="govuk-header__navigation-item">
                <a
                  className="govuk-header__link" 
                  href="/support"
                >
                  Support
                </a>
              </li>
              {props.authenticated ? <li className="govuk-header__navigation-item">
                <a
                  className="govuk-header__link"
                  href="/marketplace"
                >
                  Marketplace
                </a>
              </li> : undefined}
              {props.authenticated ? <li className="govuk-header__navigation-item">
                <a
                  className="govuk-header__link" 
                  href="/"
                >
                  Organisations
                </a>
              </li> : undefined}
              <li className="govuk-header__navigation-item">
                <a
                  className="govuk-header__link"
                  href="https://docs.cloud.service.gov.uk"
                >
                  Documentation
                </a>
              </li>
              {props.isPlatformAdmin ? platformLink : undefined}
              {props.authenticated
                ? <li className="govuk-header__navigation-item">
                    <a 
                      className="govuk-header__link" 
                      href="/auth/logout"
                    >
                      Sign out
                    </a>
                  </li>
                : <li className="govuk-header__navigation-item">
                    <a 
                      className="govuk-header__link" 
                      href="/"
                    >
                      Sign In
                    </a>
                  </li>}
              <li className="govuk-header__navigation-item">
                <a
                  href="https://www.cloud.service.gov.uk/sign-in"
                  title="Switch to a different region"
                  className={`govuk-header__link govuk-tag app-region-tag app-region-tag--${props.location.toLowerCase()}`}
                  aria-label={`Current region: ${props.location.toLowerCase()}. Switch to a different region.`}
                >
                  <span className="app-region-tag__text">Region:</span> {props.location}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function Main(params: IMainProperties): ReactElement {
  const classess = params.classess || [];

  return (
    <main
      className={['govuk-main-wrapper', ...classess].join(' ')}
      id="main-content"
      role="main"
      lang={params.language}
    >
      {params.children}
    </main>
  );
}

export function Footer({ authenticated }: IFooterProperties): ReactElement {
  return (
    <footer className="govuk-footer govuk-!-display-none-print" role="contentinfo">
      <div className="govuk-width-container ">
        <div className="govuk-footer__navigation">
          <div className="govuk-footer__section govuk-grid-column-one-half">
            <h2 className="govuk-footer__heading govuk-heading-m">Support</h2>
            <ul className="govuk-footer__list">
              <li className="govuk-footer__list-item">
                <a
                  className="govuk-footer__link"
                  href="https://status.cloud.service.gov.uk"
                >
                  System status
                </a>
              </li>
              <li className="govuk-footer__list-item">
                <a className="govuk-footer__link" href="https://docs.cloud.service.gov.uk/">
                  Documentation
                </a>
              </li>
              <li className="govuk-footer__list-item">
                <a className="govuk-footer__link" href="/support">
                  Raise an issue
                </a>
              </li>
              {authenticated ? <li className="govuk-footer__list-item">
                <a className="govuk-footer__link" href="/support/static-ip">
                  Static IPs
                </a>
              </li> : null}
              <li className="govuk-footer__list-item">
                <a 
                  className="govuk-footer__link"
                  href="https://ukgovernmentdigital.slack.com/app_redirect?channel=govuk-paas">
                    Chat to us on Slack
                </a>
              </li>
            </ul>
          </div>
          <div className="govuk-footer__section govuk-grid-column-one-half">
            <h2 className="govuk-footer__heading govuk-heading-m">Legal terms</h2>
            <ul className="govuk-footer__list">
              {authenticated ? <li className="govuk-footer__list-item">
                <a className="govuk-footer__link" href="/support/mou-crown">
                  Memorandum of understanding for Crown bodies
                </a>
              </li> : null}
              {authenticated ? <li className="govuk-footer__list-item">
                <a className="govuk-footer__link" href="/support/mou-non-crown">
                  Memorandum of understanding for non-Crown bodies
                </a>
              </li> : null}
              <li className="govuk-footer__list-item">
                <a
                  className="govuk-footer__link"
                  href="https://www.cloud.service.gov.uk/privacy-notice"
                >
                  Privacy notice
                </a>
              </li>
              <li className="govuk-footer__list-item">
                <a
                  className="govuk-footer__link"
                  href="https://www.cloud.service.gov.uk/terms-of-use"
                >
                  Terms of use
                </a>
              </li>
              <li className="govuk-footer__list-item">
                <a
                  className="govuk-footer__link"
                  href="https://www.cloud.service.gov.uk/accessibility-statement"
                >
                  Accessibility statement
                </a>
              </li>
              <li className="govuk-footer__list-item">
                <a
                  className="govuk-footer__link"
                  href="https://www.cloud.service.gov.uk/cookies"
                >
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="govuk-footer__section-break" />

        <div className="govuk-footer__meta">
          <div className="govuk-footer__meta-item govuk-footer__meta-item--grow">
            <div className="govuk-footer__meta-custom">
              Built by the {}
              <a
                href="https://www.gov.uk/government/organisations/government-digital-service"
                className="govuk-footer__link">
                  Government Digital Service
                </a>
            </div>
            <svg
              aria-hidden="true"
              focusable="false"
              className="govuk-footer__licence-logo"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 483.2 195.7"
              height="17"
              width="41"
            >
              <path
                fill="currentColor"
                d="M421.5 142.8V.1l-50.7 32.3v161.1h112.4v-50.7zm-122.3-9.6A47.12 47.12 0 0 1 221 97.8c0-26 21.1-47.1 47.1-47.1 16.7 0 31.4 8.7 39.7 21.8l42.7-27.2A97.63 97.63 0 0 0 268.1 0c-36.5 0-68.3 20.1-85.1 49.7A98 98 0 0 0 97.8 0C43.9 0 0 43.9 0 97.8s43.9 97.8 97.8 97.8c36.5 0 68.3-20.1 85.1-49.7a97.76 97.76 0 0 0 149.6 25.4l19.4 22.2h3v-87.8h-80l24.3 27.5zM97.8 145c-26 0-47.1-21.1-47.1-47.1s21.1-47.1 47.1-47.1 47.2 21 47.2 47S123.8 145 97.8 145"
              />
            </svg>
            <span className="govuk-footer__licence-description">
              All content is available under the{' '}
              <a
                className="govuk-footer__link"
                href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                rel="license"
              >
                Open Government Licence v3.0
              </a>
              , except where otherwise stated
            </span>
          </div>
          <div className="govuk-footer__meta-item">
            <a
              className="govuk-footer__link govuk-footer__copyright-logo"
              href="https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/"
            >
              © Crown copyright
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SubNavigation(props: ISubNavigationProperties): ReactElement {
  return (
    <div className="govuk-grid-row subnav govuk-!-display-none-print">
      <div className="govuk-grid-column-one-third">
        <strong>{props.title}</strong>
      </div>

      <nav className="govuk-grid-column-two-thirds">
        {props.items.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className={`govuk-link ${item.active ? 'active' : ''}`}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function CommandLineAlternative(props: ICommandLineAlternativeProperties): ReactElement {
  return (
    <>
      <h2 className="govuk-heading-s">In the command line</h2>

      <p>
        You can also view this information in the Cloud Foundry command line interface by running:
      </p>

      <p>
        <code>{props.children}</code>
      </p>

      <a
        href="https://docs.cloud.service.gov.uk/get_started.html#set-up-the-cloud-foundry-command-line"
        className="govuk-link"
      >
        Read more about using GOV.UK PaaS in the command line interface.
      </a>
    </>
  );
}

export function Tick(): ReactElement {
  return (
    <Fragment>
      <span className="tick-symbol" aria-hidden="true">&#10003;</span>
      <span className="govuk-visually-hidden">yes</span>
    </Fragment>
    );
}

export function NoTick(): ReactElement {
  return <span className="govuk-visually-hidden">no</span>;
}

export function NotificationBanner(): ReactElement {
  return (
    <>
    <div className="govuk-notification-banner" role="alert" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner">
      <div className="govuk-notification-banner__header">
        <h2 className="govuk-notification-banner__title" id="govuk-notification-banner-title">
          Important
        </h2>
      </div>
      <div className="govuk-notification-banner__content">
        <h3 className="govuk-notification-banner__heading">
          Migration guidance and request for migration owner details
        </h3>
        <p className="govuk-body">We have <a className="govuk-notification-banner__link" href="https://cloud.service.gov.uk/migration-guidance/">published migration guidance</a> for tenants.</p>
        <p className="govuk-body">We&apos;re confirming the migration owner for service or services in this space. <a className="govuk-notification-banner__link" href="/support/contact-us">Please tell us</a> who the responsible person is in your organisation.</p>
      </div>      
    </div>
    </>
  )
}
