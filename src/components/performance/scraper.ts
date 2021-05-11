import axios from 'axios'
import moment from 'moment'
import { Logger } from 'pino'

import { intercept } from '../../lib/axios-logger/axios'
import { IMetricSerie } from '../../lib/metrics'
import PromClient from '../../lib/prom'

const DELAY = 2000

export const now = moment().subtract(1, 'hour')
export const period = moment.duration(1, 'week')
export const timeAgo = moment().subtract(1, 'year')

const delay = async (ms: number): Promise<object> => await new Promise(resolve => setTimeout(resolve, ms))

interface IConfig {
  readonly pingdom: {
    readonly checkID: string
    readonly endpoint: string
    readonly token: string
  }
  readonly prometheus: {
    readonly endpoint: string
    readonly password: string
    readonly username: string
  }
}

interface IPingdomUptimeResponse {
  readonly summary: {
    readonly status: {
      readonly totalup: number
      readonly totaldown: number
      readonly totalunknown: number
    }
  }
}

export interface IScrapedData {
  readonly organizations?: readonly IMetricSerie[]
  readonly applications?: readonly IMetricSerie[]
  readonly services?: readonly IMetricSerie[]
  readonly uptime?: number
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
  serviceCount: 'sum(group by (service_instance_id) (cf_service_instance_info{last_operation_type=~"create|update"}))'
}

function calculateUptime (data: IPingdomUptimeResponse): number {
  const { totalup, totaldown, totalunknown } = data.summary.status
  const total = totalup + totaldown + totalunknown
  const totalDownTime = totaldown + totalunknown
  const uptimePercentage = ((total - totalDownTime) / total) * 100

  return parseFloat(uptimePercentage.toFixed(2))
}

export async function scrape (cfg: IConfig, logger: Logger): Promise<IScrapedData> {
  const pingdom = axios.create({
    baseURL: cfg.pingdom.endpoint,
    headers: {
      Authorization: `Bearer ${cfg.pingdom.token}`
    },
    timeout: 1000
  })
  intercept(pingdom, 'pingdom', logger)

  const prometheus = new PromClient(
    cfg.prometheus.endpoint,
    cfg.prometheus.username,
    cfg.prometheus.password,
    logger
  )

  logger.info('Starting the scraper')

  logger.info('Obtaining uptime data...')
  const uptimeResponse = await pingdom.get<IPingdomUptimeResponse>(`/api/3.1/summary.average/${cfg.pingdom.checkID}`, {
    params: {
      from: timeAgo.unix(),
      to: now.unix(),
      includeuptime: true
    }
  })
  /* istanbul ignore next */
  if (uptimeResponse.status !== 200) {
    logger.error('Unable to obtain uptime data...', uptimeResponse.data)
  }

  await delay(DELAY)

  logger.info('Obtaining organizations data...')
  const organizations = await prometheus.getSeries(
    queries.organizations,
    period.asSeconds(),
    timeAgo.toDate(),
    now.toDate()
  )
  /* istanbul ignore next */
  if (organizations == null) {
    logger.error('Unable to obtain organizastions data...')
  }

  await delay(DELAY)

  logger.info('Obtaining applications data...')
  const applicationCount = await prometheus.getSeries(
    queries.applicationCount,
    period.asSeconds(),
    timeAgo.toDate(),
    now.toDate()
  )
  /* istanbul ignore next */
  if (applicationCount == null) {
    logger.error('Unable to obtain applications data...')
  }

  await delay(DELAY)

  logger.info('Obtaining services data...')
  const serviceCount = await prometheus.getSeries(
    queries.serviceCount,
    period.asSeconds(),
    timeAgo.toDate(),
    now.toDate()
  )
  /* istanbul ignore next */
  if (serviceCount == null) {
    logger.error('Unable to obtain services data...')
  }

  return {
    applications: applicationCount,
    organizations: organizations,
    services: serviceCount,
    uptime: uptimeResponse.status === 200 ? calculateUptime(uptimeResponse.data) : undefined
  }
}
