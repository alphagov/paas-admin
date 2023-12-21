import { encode } from 'html-entities';
import React, { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';


import { IViewContext } from '../components/app';
import { Breadcrumbs, IBreadcrumbsItem } from '../components/breadcrumbs';

import './govuk.screen.scss';
import {
  Footer,
  Header,
  ISubNavigationProperties,
  Main,
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

    const sanitizedTitle = encode(this._title, { mode: 'nonAsciiPrintable' }) || undefined;

    return `<!DOCTYPE html>
    <html lang=${this._language} class="govuk-template">
        <head>
          <meta charSet="utf-8" />
          <title lang="${this._language}">${sanitizedTitle ||
      '[Decommissioned] GOV.UK Platform as a Service - Administration Tool'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="${themeColor}" />
          <meta name="csrf-token" content="${this.ctx.csrf}" />

          <link rel="icon" sizes="48x48" href="${assetPath}/images/favicon.ico">
          <link rel="icon" sizes="any" href="${assetPath}/images/favicon.svg" type="image/svg+xml">
          <link rel="mask-icon" href="${assetPath}/images/govuk-icon-mask.svg" color="${themeColor}">
          <link rel="apple-touch-icon" href="${assetPath}/images/govuk-icon-180.png">
          <link rel="manifest" href="${assetPath}/manifest.json">

          <meta name="x-user-identity-origin" content="${this.ctx.origin || ''}" />

          <link href="${assetPath}/govuk.screen.css" media="all" rel="stylesheet" />

          <meta property="og:image" content="${assetURL}/images/govuk-opengraph-image.png" />
        </head>
          <body class="govuk-template__body">
            <script>document.body.className += ' js-enabled' + ('noModule' in HTMLScriptElement.prototype ? ' govuk-frontend-supported' : '');</script>



            ${renderToStaticMarkup(<>
              <a href="#main-content" className="govuk-skip-link" data-module="govuk-skip-link">
                Skip to main content
              </a>
              <Header
                location={this.ctx.location}
                isPlatformAdmin={!!this.ctx.isPlatformAdmin}
                authenticated={this.ctx.authenticated}
              />

              <div className="govuk-width-container">
                <div className="govuk-phase-banner">
                  <p className="govuk-phase-banner__content">
                    <strong className="govuk-tag govuk-phase-banner__content__tag">
                      decommissioned
                    </strong>
                    <span className="govuk-phase-banner__text">
                      Thanks to everyone who has used our platform over the years.
                    </span>
                  </p>
                </div>
                {this._subnav
                  ? <SubNavigation title={this._subnav.title} items={this._subnav.items} />
                  : undefined}

                {this._breadcrumbs
                  ? <Breadcrumbs items={this._breadcrumbs} />
                  : undefined}

                <Main>{page}</Main>
              </div>

              <Footer authenticated={this.ctx.authenticated} />
            </>)}
          <script type="module" src="${assetPath}/init.js"></script>
        </body>
      </html>`;
  }
}
