import moment from 'moment';
import { BaseLogger } from 'pino';

import { IMetricSerie } from '../../lib/metrics';
import PromClient from '../../lib/prom';

export const now = moment().subtract(1, 'hour').toDate();
const DELAY = 2000;
export const period = moment.duration(1, 'week');
export const timeAgo = moment().subtract(1, 'year').toDate();

const delay = async (ms: number): Promise<object> => await new Promise(resolve => setTimeout(resolve, ms));

interface IConfig {
  readonly pingdom: object;
  readonly prometheus: {
    readonly endpoint: string;
    readonly password: string;
    readonly username: string;
  };
}

export interface IScrapedData {
  readonly organizations?: ReadonlyArray<IMetricSerie>;
  readonly applications?: ReadonlyArray<IMetricSerie>;
  readonly services?: ReadonlyArray<IMetricSerie>;
}

const queries = {
  applicationCount: `sum (group by (organization_name,space_name,application_name) (
    cf_application_info{organization_name!~"(AIVENBACC|BACC|ACC|ASATS|SMOKE).*",state="STARTED"}
  ))`,
  organizations: `sum by (type) (group by (organization_name,type) (label_replace(
    label_replace(
      cf_organization_info{organization_name!~"(AIVENBACC|BACC|ACC|ASATS|SMOKE).*"},
      "type", "billable", "quota_name", "(gds-non-chargeable|small|medium|large|xlarge|2xlarge|4xlarge|8xlarge)"
    ),
    "type", "trial", "quota_name", "default"
  )))`,
  serviceCount: 'sum(group by (service_instance_id) (cf_service_instance_info{last_operation_type=~"create|update"}))',
};

export async function scrape(cfg: IConfig, logger: BaseLogger): Promise<IScrapedData> {
  const prometheus = new PromClient(
    cfg.prometheus.endpoint,
    cfg.prometheus.username,
    cfg.prometheus.password,
    logger,
  );

  logger.info('Starting the scraper');

  logger.info('Obtaining organizations data...');
  const organizations = await prometheus.getSeries(queries.organizations, period.asSeconds(), timeAgo, now);
  /* istanbul ignore next */
  if (!organizations) {
    logger.error('Unable to obtain organizastions data...');
  }

  await delay(DELAY);

  logger.info('Obtaining applications data...');
  const applicationCount = await prometheus.getSeries(queries.applicationCount, period.asSeconds(), timeAgo, now);
  /* istanbul ignore next */
  if (!applicationCount) {
    logger.error('Unable to obtain applications data...');
  }

  await delay(DELAY);

  logger.info('Obtaining services data...');
  const serviceCount = await prometheus.getSeries(queries.serviceCount, period.asSeconds(), timeAgo, now);
  /* istanbul ignore next */
  if (!serviceCount) {
    logger.error('Unable to obtain services data...');
  }

  return {
    applications: applicationCount,
    organizations: organizations,
    services: serviceCount,
  };
}
