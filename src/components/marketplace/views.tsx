import React, { ReactElement } from 'react';

import { Abbreviation } from '../../layouts/helpers';
import { CommandLineAlternative, NoTick, Tick } from '../../layouts/partials';
import { IV3Service, IV3ServicePlan } from '../../lib/cf/types';
import { RouteLinker } from '../app';

import autoscalerLogo from './icons/autoscaler.png';
import cdnLogo from './icons/cdn.png';
import cloudLogo from './icons/cloud.png';
import elasticsearchLogo from './icons/elasticsearch.png';
import influxdbLogo from './icons/influxdb.png';
import mysqlLogo from './icons/mysql.png';
import postgresLogo from './icons/postgres.png';
import redisLogo from './icons/redis.png';
import s3Logo from './icons/s3.png';
import sqsLogo from './icons/sqs.png';

export interface IPaaSServiceMetadata {
  readonly displayName: string;
  readonly longDescription?: string;
  readonly documentationUrl?: string;
  readonly providerDisplayName: string;
  readonly supportUrl: string;
  readonly AdditionalMetadata?: {
    readonly otherDocumentation?: ReadonlyArray<string>;
    readonly usecase?: ReadonlyArray<string>;
  };
}

export interface IPaaSServicePlanMetadata {
  readonly displayName: string;
  readonly AdditionalMetadata?: {
    readonly backups?: boolean;
    readonly concurrentConnections: number;
    readonly cpu?: number;
    readonly encrypted?: boolean;
    readonly highIOPS?: boolean;
    readonly highlyAvailable?: boolean;
    readonly instanceClass: string;
    readonly memory?: { readonly amount: number; readonly unit: string };
    readonly nodes?: number;
    readonly storage?: { readonly amount: number; readonly unit: string };
    readonly trial?: boolean;
    readonly version?: string;
  };
}

interface ICustomMetadata {
  readonly backups?: boolean;
  readonly bullets?: ReadonlyArray<string>;
  readonly concurrentConnections?: number;
  readonly displayName?: string;
  readonly encrypted?: boolean;
  readonly highlyAvailable?: boolean;
  readonly highIOPS?: boolean;
  readonly memory?: {
    readonly amount: number;
    readonly unit: string;
  };
  readonly storage?: {
    readonly amount: number;
    readonly unit: string;
  };
}

interface IMarketplaceItemPageProperties {
  readonly linkTo: RouteLinker;
  readonly service: IV3Service<IPaaSServiceMetadata>;
  readonly plans: ReadonlyArray<IV3ServicePlan<IPaaSServicePlanMetadata>>;
  readonly version?: string;
  readonly versions: ReadonlyArray<string>;
}

interface IMarketplacePageProperties {
  readonly linkTo: RouteLinker;
  readonly services: ReadonlyArray<IV3Service<IPaaSServiceMetadata>>;
}

interface IServiceDetails {
  readonly [serviceLabel: string]: {
    readonly description?: string;
    readonly image: string;
    readonly imageTitle: string;
    readonly name: string;
    readonly usecase?: ReadonlyArray<string>;
  };
}

interface ILogoProperties {
  readonly image: string;
  readonly imageTitle: string;
  readonly label?: string;
}

interface IPlanTabProperties {
  readonly linkTo: RouteLinker;
  readonly plans: ReadonlyArray<IV3ServicePlan<IPaaSServicePlanMetadata>>;
  readonly serviceGUID: string;
  readonly version?: string;
  readonly versions: ReadonlyArray<string>;
}

interface ITabProperties {
  readonly active: boolean;
  readonly href: string;
  readonly children: string;
}

interface ITableRowProperties {
  readonly availableInTrial: boolean;
  readonly canBeEncrypted: boolean;
  readonly canBeHighIOPS: boolean;
  readonly canBeHighlyAvailable: boolean;
  readonly data: ICustomMetadata;
  readonly limitsConcurrentConnections: boolean;
  readonly limitsMemory: boolean;
  readonly limitsStorage: boolean;
  readonly name: string;
  readonly providesBackups: boolean;
}

const serviceDetails: IServiceDetails = {
  'autoscaler': {
    image: autoscalerLogo,
    imageTitle: 'Autoscaler - GOV.UK PaaS Logo',
    name: 'Autoscaler',
  },
  'aws-s3-bucket': {
    image: s3Logo,
    imageTitle: 'Amazon Web Services - S3 Bucket - Official Logo',
    name: 'S3',
  },
  'aws-sqs-queue': {
    image: sqsLogo,
    imageTitle: 'Amazon Web Services - SQS Queue - Official Logo',
    name: 'SQS',
  },
  'cdn-route': {
    image: cdnLogo,
    imageTitle: 'Amazon Web Services - CloudFront - Official Logo',
    name: 'CloudFront',
  },
  'elasticsearch': {
    image: elasticsearchLogo,
    imageTitle: 'Elasticsearch - Official Logo',
    name: 'Elasticsearch',
  },
  'influxdb': {
    image: influxdbLogo,
    imageTitle: 'InfluxDB - Official Logo',
    name: 'InfluxDB',
  },
  'mysql': {
    image: mysqlLogo,
    imageTitle: 'MySQL - Official Logo',
    name: 'MySQL',
  },
  'postgres': {
    image: postgresLogo,
    imageTitle: 'PostgreSQL - Official Logo',
    name: 'Postgres',
  },
  'redis': {
    image: redisLogo,
    imageTitle: 'Redis - Official Logo',
    name: 'Redis',
  },
};

/* istanbul ignore next */
function documentationTitle(service: string, url: string): string {
  const u = new URL(url);

  switch (u.hostname) {
    case 'docs.cloud.service.gov.uk':
      return `GOV.UK PaaS ${service} documentation`;
    case 'aws.amazon.com':
    case 'docs.aws.amazon.com':
      return `AWS RDS ${service} documentation`;
    case 'help.aiven.io':
      return `Aiven ${service} documentation`;
    default:
      return `${service} documentation`;
  }
}

export function Tab(props: ITabProperties): ReactElement {
  const classess = ['govuk-tabs__list-item'];
  if (props.active) {
    classess.push('govuk-tabs__list-item--selected');
  }

  return (
    <li className={classess.join(' ')}>
      <a href={props.href} className="govuk-tabs__tab">
        {props.children}
      </a>
    </li>
  );
}

function TableRow(props: ITableRowProperties): ReactElement {
  return (
    <tr className="govuk-table__row">
      <th scope="row" className="govuk-table__header">{props.name}</th>
      <td className="govuk-table__cell">{props.availableInTrial ? <Tick /> : <NoTick />}</td>
      {props.canBeHighIOPS
        ? <td className="govuk-table__cell">
            {props.data.highIOPS ? <Tick /> : <NoTick />}
          </td>
        : null}
      {props.providesBackups
        ? <td className="govuk-table__cell">
            {props.data.backups ? <Tick /> : <NoTick />}
          </td>
        : null}
      {props.canBeEncrypted
        ? <td className="govuk-table__cell">
            {props.data.encrypted ? <Tick /> : <NoTick />}
          </td>
        : null}
      {props.canBeHighlyAvailable
        ? <td className="govuk-table__cell">
            {props.data.highlyAvailable ? <Tick /> : <NoTick />}
          </td>
        : null}
      {props.limitsConcurrentConnections
        ? <td className="govuk-table__cell govuk-table__cell--numeric">
            {props.data.concurrentConnections}
          </td>
        : null}
      {props.limitsMemory
        ? <td className="govuk-table__cell govuk-table__cell--numeric">
            {props.data.memory?.amount}
            {props.data.memory?.unit}
          </td>
        : null}
      {props.limitsStorage
        ? <td className="govuk-table__cell govuk-table__cell--numeric">
            {props.data.storage?.amount}
            {props.data.storage?.unit}
          </td>
        : null}
    </tr>
  );
}

export function PlanTab(props: IPlanTabProperties): ReactElement {
  const canBeEncrypted = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.encrypted);
  const canBeHA = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.highlyAvailable);
  const canBeHighIOPS = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.highIOPS);
  const limitsCC = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.concurrentConnections);
  const limitsMemory = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.memory);
  const limitsStorage = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.storage);
  const providesBackups = props.plans.some(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.backups);

  return (
    <div className="govuk-tabs">
      <h2 className="govuk-tabs__title">Contents</h2>

      <ul className="govuk-tabs__list">
        {props.versions.map((version, index) => (
          <Tab key={index} active={version === props.version} href={props.linkTo('marketplace.service', {
            serviceGUID: props.serviceGUID,
            version,
          })}>
            {`Version ${version}`}
          </Tab>
        ))}
      </ul>

      <section className="govuk-tabs__panel" id="service-plans">
        <div className="scrollable-table-container">
          <table className="govuk-table">
            <caption className="govuk-table__caption">Version {props.version}</caption>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header">Plan</th>
                <th scope="col" className="govuk-table__header">Available in trial</th>
                {canBeHighIOPS
                  ? <th scope="col" className="govuk-table__header">
                      High <Abbreviation description="Input/Output Operations Per Second">IOPS</Abbreviation>
                    </th>
                  : null}
                {providesBackups
                  ? <th scope="col" className="govuk-table__header">Backups</th>
                  : null}
                {canBeEncrypted
                  ? <th scope="col" className="govuk-table__header">Encrypted</th>
                  : null}
                {canBeHA
                  ? <th scope="col" className="govuk-table__header">
                      <Abbreviation description="Highly Available">HA</Abbreviation>
                    </th>
                  : null}
                {limitsCC
                  ? <th scope="col" className="govuk-table__header govuk-table__header--numeric">
                      <Abbreviation description="Concurrent Connections">Connections</Abbreviation>
                    </th>
                  : null}
                {limitsMemory
                  ? <th scope="col" className="govuk-table__header govuk-table__header--numeric">Memory</th>
                  : null}
                {limitsStorage
                  ? <th scope="col" className="govuk-table__header govuk-table__header--numeric">Space</th>
                  : null}
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {props.plans.map((plan, index) => (
                <TableRow key={index}
                  availableInTrial={plan.free}
                  canBeEncrypted={canBeEncrypted}
                  canBeHighIOPS={canBeHighIOPS}
                  canBeHighlyAvailable={canBeHA}
                  data={plan.broker_catalog.metadata.AdditionalMetadata || {}}
                  limitsConcurrentConnections={limitsCC}
                  limitsMemory={limitsMemory}
                  limitsStorage={limitsStorage}
                  name={plan.name}
                  providesBackups={providesBackups}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Logo(props: ILogoProperties): ReactElement {
  return (
    <figure>
      <div>
        <img src={props.image} alt={props.imageTitle} />
      </div>

      <figcaption>{props.label}</figcaption>
    </figure>
  );
}

export function MarketplaceItemPage(props: IMarketplaceItemPageProperties): ReactElement {
  const details = serviceDetails[props.service.name] || { name: props.service.name };

  return (
    <div className="govuk-grid-row service-details">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">
          <span className="govuk-caption-l">
            <span className="govuk-visually-hidden">Service</span>{' '}
            {props.service.broker_catalog.metadata.displayName || props.service.name}
          </span>{' '}
          Version {props.version}
        </h1>

        <p className="govuk-body">{props.service.broker_catalog.metadata.longDescription}</p>

        <dl className="govuk-summary-list govuk-summary-list--no-border">
          <div className="govuk-summary-list__row" id="service-provider">
            <dt className="govuk-summary-list__key">Provider</dt>
            <dd className="govuk-summary-list__value">
              {props.service.broker_catalog.metadata.providerDisplayName}
            </dd>
          </div>

          {props.service.broker_catalog.metadata.AdditionalMetadata?.usecase?.length
            ? <div className="govuk-summary-list__row" id="service-usecase">
                <dt className="govuk-summary-list__key">Usecase</dt>
                <dd className="govuk-summary-list__value">
                  <ul className="govuk-list">
                    {props.service.broker_catalog.metadata.AdditionalMetadata.usecase.map((usecase, index) =>
                      <li key={index}>{usecase}</li>)}
                  </ul>
                </dd>
              </div>
            : null}

          {props.service.broker_catalog.metadata.documentationUrl
            ? <div className="govuk-summary-list__row" id="service-documentation">
                <dt className="govuk-summary-list__key">Documentation</dt>
                <dd className="govuk-summary-list__value">
                  <ul className="govuk-list">
                    <li>
                      <a href={props.service.broker_catalog.metadata.documentationUrl} className="govuk-link">
                        {documentationTitle(details.name, props.service.broker_catalog.metadata.documentationUrl)}
                      </a>
                    </li>
                    {props.service.broker_catalog.metadata.AdditionalMetadata?.otherDocumentation?.map(
                      (docs: string, index: number) => (
                        <li key={index}>
                          <a href={docs} className="govuk-link">{documentationTitle(details.name, docs)}</a>
                        </li>
                      ))}
                  </ul>
                </dd>
              </div>
            : null}

          {props.service.tags.length
            ? <div className="govuk-summary-list__row" id="service-tags">
                <dt className="govuk-summary-list__key">Tags</dt>
                <dd className="govuk-summary-list__value">
                  <ul className="govuk-list">
                    {props.service.tags.map((tag, index) => <li key={index}>{tag}</li>)}
                  </ul>
                </dd>
              </div>
            : null}
        </dl>
      </div>

      <div className="govuk-grid-column-one-third">
        <Logo
          image={details.image || cloudLogo}
          imageTitle={`${details.imageTitle || 'Missing service logo'}`}
        />
      </div>

      <div className="govuk-grid-column-full">
        <PlanTab
          linkTo={props.linkTo}
          plans={props.plans}
          serviceGUID={props.service.guid}
          version={props.version}
          versions={props.versions}
        />

        <CommandLineAlternative>{`cf marketplace -e ${props.service.name}`}</CommandLineAlternative>
      </div>
    </div>
  );
}

export function MarketplacePage(props: IMarketplacePageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">Marketplace</h1>

        <p className="govuk-body">
          Many applications rely on backing services such as a database, an email delivery service or monitoring system.
          Through the GOV.UK PaaS marketplace, you can create certain backing services and bind them to your
          application.
        </p>

        <p className="govuk-body">
          For each of the listed services, you can find how much an instance costs, its availability, size
          and other options that will help you to make the right choice for your application.
        </p>

        <p className="govuk-body">
          The services that are currently offered through marketplace are:
        </p>

        <ul className="govuk-list marketplace-list">
          {props.services.map((service, index) => {
            const details = serviceDetails[service.name] || {};

            return <li key={index}>
              <a href={props.linkTo('marketplace.service', {
                serviceGUID: service.guid,
              })} className="govuk-link">
                <Logo
                  image={details.image || cloudLogo}
                  imageTitle={`${details.imageTitle || 'Missing service logo'}`}
                  label={service.broker_catalog.metadata.displayName || service.name}
                />
              </a>
            </li>;
          })}
        </ul>

        <CommandLineAlternative>cf marketplace</CommandLineAlternative>
      </div>
    </div>
  );
}
