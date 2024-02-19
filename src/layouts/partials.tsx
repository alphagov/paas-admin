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

  return (
    <header className="govuk-header" role="banner" data-module="govuk-header">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <a
            href="/"
            className="govuk-header__link govuk-header__link--homepage"
          >
          <svg
            focusable="false"
            role="img"
            className="govuk-header__logotype"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 148 30"
            height="30"
            width="148"
            aria-label="GOV.UK"
          >
            <title>GOV.UK</title>
            <path d="M22.6 10.4c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4m-5.9 6.7c-.9.4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4m10.8-3.7c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s0 2-1 2.4m3.3 4.8c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4M17 4.7l2.3 1.2V2.5l-2.3.7-.2-.2.9-3h-3.4l.9 3-.2.2c-.1.1-2.3-.7-2.3-.7v3.4L15 4.7c.1.1.1.2.2.2l-1.3 4c-.1.2-.1.4-.1.6 0 1.1.8 2 1.9 2.2h.7c1-.2 1.9-1.1 1.9-2.1 0-.2 0-.4-.1-.6l-1.3-4c-.1-.2 0-.2.1-.3m-7.6 5.7c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s0 2 1 2.4m-5 3c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s.1 2 1 2.4m-3.2 4.8c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s0 2 1 2.4m14.8 11c4.4 0 8.6.3 12.3.8 1.1-4.5 2.4-7 3.7-8.8l-2.5-.9c.2 1.3.3 1.9 0 2.7-.4-.4-.8-1.1-1.1-2.3l-1.2 4c.7-.5 1.3-.8 2-.9-1.1 2.5-2.6 3.1-3.5 3-1.1-.2-1.7-1.2-1.5-2.1.3-1.2 1.5-1.5 2.1-.1 1.1-2.3-.8-3-2-2.3 1.9-1.9 2.1-3.5.6-5.6-2.1 1.6-2.1 3.2-1.2 5.5-1.2-1.4-3.2-.6-2.5 1.6.9-1.4 2.1-.5 1.9.8-.2 1.1-1.7 2.1-3.5 1.9-2.7-.2-2.9-2.1-2.9-3.6.7-.1 1.9.5 2.9 1.9l.4-4.3c-1.1 1.1-2.1 1.4-3.2 1.4.4-1.2 2.1-3 2.1-3h-5.4s1.7 1.9 2.1 3c-1.1 0-2.1-.2-3.2-1.4l.4 4.3c1-1.4 2.2-2 2.9-1.9-.1 1.5-.2 3.4-2.9 3.6-1.9.2-3.4-.8-3.5-1.9-.2-1.3 1-2.2 1.9-.8.7-2.3-1.2-3-2.5-1.6.9-2.2.9-3.9-1.2-5.5-1.5 2-1.3 3.7.6 5.6-1.2-.7-3.1 0-2 2.3.6-1.4 1.8-1.1 2.1.1.2.9-.3 1.9-1.5 2.1-.9.2-2.4-.5-3.5-3 .6 0 1.2.3 2 .9l-1.2-4c-.3 1.1-.7 1.9-1.1 2.3-.3-.8-.2-1.4 0-2.7l-2.9.9C1.3 23 2.6 25.5 3.7 30c3.7-.5 7.9-.8 12.3-.8m28.3-11.6c0 .9.1 1.7.3 2.5.2.8.6 1.5 1 2.2.5.6 1 1.1 1.7 1.5.7.4 1.5.6 2.5.6.9 0 1.7-.1 2.3-.4s1.1-.7 1.5-1.1c.4-.4.6-.9.8-1.5.1-.5.2-1 .2-1.5v-.2h-5.3v-3.2h9.4V28H55v-2.5c-.3.4-.6.8-1 1.1-.4.3-.8.6-1.3.9-.5.2-1 .4-1.6.6s-1.2.2-1.8.2c-1.5 0-2.9-.3-4-.8-1.2-.6-2.2-1.3-3-2.3-.8-1-1.4-2.1-1.8-3.4-.3-1.4-.5-2.8-.5-4.3s.2-2.9.7-4.2c.5-1.3 1.1-2.4 2-3.4.9-1 1.9-1.7 3.1-2.3 1.2-.6 2.6-.8 4.1-.8 1 0 1.9.1 2.8.3.9.2 1.7.6 2.4 1s1.4.9 1.9 1.5c.6.6 1 1.3 1.4 2l-3.7 2.1c-.2-.4-.5-.9-.8-1.2-.3-.4-.6-.7-1-1-.4-.3-.8-.5-1.3-.7-.5-.2-1.1-.2-1.7-.2-1 0-1.8.2-2.5.6-.7.4-1.3.9-1.7 1.5-.5.6-.8 1.4-1 2.2-.3.8-.4 1.9-.4 2.7zM71.5 6.8c1.5 0 2.9.3 4.2.8 1.2.6 2.3 1.3 3.1 2.3.9 1 1.5 2.1 2 3.4s.7 2.7.7 4.2-.2 2.9-.7 4.2c-.4 1.3-1.1 2.4-2 3.4-.9 1-1.9 1.7-3.1 2.3-1.2.6-2.6.8-4.2.8s-2.9-.3-4.2-.8c-1.2-.6-2.3-1.3-3.1-2.3-.9-1-1.5-2.1-2-3.4-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2c.4-1.3 1.1-2.4 2-3.4.9-1 1.9-1.7 3.1-2.3 1.2-.5 2.6-.8 4.2-.8zm0 17.6c.9 0 1.7-.2 2.4-.5s1.3-.8 1.7-1.4c.5-.6.8-1.3 1.1-2.2.2-.8.4-1.7.4-2.7v-.1c0-1-.1-1.9-.4-2.7-.2-.8-.6-1.6-1.1-2.2-.5-.6-1.1-1.1-1.7-1.4-.7-.3-1.5-.5-2.4-.5s-1.7.2-2.4.5-1.3.8-1.7 1.4c-.5.6-.8 1.3-1.1 2.2-.2.8-.4 1.7-.4 2.7v.1c0 1 .1 1.9.4 2.7.2.8.6 1.6 1.1 2.2.5.6 1.1 1.1 1.7 1.4.6.3 1.4.5 2.4.5zM88.9 28 83 7h4.7l4 15.7h.1l4-15.7h4.7l-5.9 21h-5.7zm28.8-3.6c.6 0 1.2-.1 1.7-.3.5-.2 1-.4 1.4-.8.4-.4.7-.8.9-1.4.2-.6.3-1.2.3-2v-13h4.1v13.6c0 1.2-.2 2.2-.6 3.1s-1 1.7-1.8 2.4c-.7.7-1.6 1.2-2.7 1.5-1 .4-2.2.5-3.4.5-1.2 0-2.4-.2-3.4-.5-1-.4-1.9-.9-2.7-1.5-.8-.7-1.3-1.5-1.8-2.4-.4-.9-.6-2-.6-3.1V6.9h4.2v13c0 .8.1 1.4.3 2 .2.6.5 1 .9 1.4.4.4.8.6 1.4.8.6.2 1.1.3 1.8.3zm13-17.4h4.2v9.1l7.4-9.1h5.2l-7.2 8.4L148 28h-4.9l-5.5-9.4-2.7 3V28h-4.2V7zm-27.6 16.1c-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7-1.2-2.7-2.7-2.7z"></path>
          </svg>{' '}
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
                  className={`govuk-header__link app-region-tag app-region-tag--${props.location.toLowerCase()}`}
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
