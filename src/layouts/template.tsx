import React, { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { IViewContext } from '../components/app';
import { Breadcrumbs, IBreadcrumbsItem } from '../components/breadcrumbs';


import govukPrintStyles from './govuk.print.scss';
import govukIE8Styles from './govuk.screen.ie8.scss';
import govukStyles from './govuk.screen.scss';
import {
  Footer,
  Header,
  ISubNavigationProperties,
  Main,
  PhaseBanner,
  SubNavigation,
} from './partials';

export class Template {
  private readonly _language = 'en';
  private _breadcrumbs?: ReadonlyArray<IBreadcrumbsItem>;
  private _subnav?: ISubNavigationProperties;

  constructor(private readonly ctx: IViewContext, private _title?: string) {}

  public set breadcrumbs(items: ReadonlyArray<IBreadcrumbsItem>) {
    this._breadcrumbs = items;
  }

  public set title(value: string) {
    this._title = value;
  }

  public set subnav(value: ISubNavigationProperties) {
    this._subnav = value;
  }

  public render(page: ReactElement): string {
    const themeColor = '#0b0c0c';
    const assetPath = '/assets';
    const assetURL = 'https://admin.cloud.service.gov.uk/assets';

    return `<!DOCTYPE html>
    <html lang=${this._language} class="govuk-template">
        <head>
          <meta charSet="utf-8" />
          <title lang="${this._language}">${this._title ||
      'GOV.UK Platform as a Service - Administration Tool'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="${themeColor}" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="csrf-token" content="${this.ctx.csrf}" />

          <link rel="shortcut icon" sizes="16x16 32x32 48x48" type="image/x-icon"
            href="${assetPath}/images/favicon.ico" />
          <link rel="mask-icon" color="${themeColor}"
            href="${assetPath}/images/govuk-mask-icon.svg" />
          <link rel="apple-touch-icon" sizes="180x180"
            href="${assetPath}/images/govuk-apple-touch-icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="167x167"
            href="${assetPath}/images/govuk-apple-touch-icon-167x167.png" />
          <link rel="apple-touch-icon" sizes="152x152"
            href="${assetPath}/images/govuk-apple-touch-icon-152x152.png" />
          <link rel="apple-touch-icon"
            href="${assetPath}/images/govuk-apple-touch-icon.png" />

          <meta name="x-user-identity-origin" content="${this.ctx.origin || ''}" />

          <!--[if !IE 8]><!-->
            <link href="${govukStyles}" media="screen" rel="stylesheet" />
            <link href="${govukPrintStyles}" media="print" rel="stylesheet" type="text/css" />
          <!--<![endif]-->

          <!--[if IE 8]>
            <link href="${govukIE8Styles}" media="screen" rel="stylesheet" />
          <![endif]-->

          <!--[if lt IE 9]>
            <script src="/html5-shiv/html5shiv.js"></script>
          <![endif]-->

          <meta property="og:image" content="${assetURL}/images/govuk-opengraph-image.png" />
        </head>
          <body class="govuk-template__body">
            <script>document.body.className = ((document.body.className) ? document.body.className + ' js-enabled' : 'js-enabled');</script>

            <a href="#main-content" class="govuk-skip-link">
              Skip to main content
            </a>

            ${renderToStaticMarkup(<>
              <Header
                location={this.ctx.location}
                isPlatformAdmin={!!this.ctx.isPlatformAdmin}
                authenticated={this.ctx.authenticated}
              />

              <div className="govuk-width-container">
                <PhaseBanner tag={{ text: 'beta' }}>
                  <a className="govuk-link" href="/support">
                    Get support
                  </a>
                  {' '}or{' '}
                  <a className="govuk-link" href="https://www.cloud.service.gov.uk/pricing">
                    view our pricing
                  </a>
                </PhaseBanner>

                {this._subnav
                  ? <SubNavigation title={this._subnav.title} items={this._subnav.items} />
                  : undefined}

                {this._breadcrumbs
                  ? <Breadcrumbs items={this._breadcrumbs} />
                  : undefined}

                <Main>{page}</Main>
              </div>

              <Footer />
            </>)}
          <script src="${assetPath}/all.js"></script>
          <script src="${assetPath}/init.js"></script>
        </body>
      </html>`;
  }
}
