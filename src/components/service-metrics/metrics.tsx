import React from 'react'

import { bytesConvert } from '../../layouts'
import { Abbreviation } from '../../layouts/helpers'
import { IMetricSerie, IMetricSerieSummary } from '../../lib/metrics'
import { drawLineGraph } from '../charts/line-graph'

import { IMetricProperties } from './views'

interface ISeries {
  readonly [key: string]: readonly IMetricSerie[]
}

interface ISummaries {
  readonly [key: string]: readonly IMetricSerieSummary[]
}

export function bytesLabel (value: number, _index: number): string {
  const bytes = bytesConvert(value)

  return `${bytes.value}${bytes.short}`
}

export function percentLabel (value: number, _index: number): string {
  return `${value}%`
}

export function numberLabel (value: number, _index: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}b`
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}m`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}k`
  }

  return `${value}`
}

export function cloudFrontMetrics (
  series: ISeries,
  summaries: ISummaries,
  downloadLink: string
): readonly IMetricProperties[] {
  return [
    {
      id: 'requests',
      format: 'number',
      title: 'Requests',
      description: 'How many HTTP requests your CDN route service has served.',
      chart: drawLineGraph('HTTP requests', 'Number', numberLabel, series.mRequests),
      units: 'Number',
      metric: 'mRequests',
      summaries: summaries.mRequests,
      downloadLink
    },
    {
      id: 'total-error-rate',
      format: 'percentile',
      title: 'Total error rate',
      description: `The percentages of HTTP responses with either a 4XX or 5XX HTTP status code, which can represent a
        client or a server error.`,
      chart: drawLineGraph(
        'percentage of HTTP requests with either a 4XX or 5XX status code',
        'Percent',
        percentLabel,
        series.mTotalErrorRate
      ),
      units: 'Percent',
      metric: 'mTotalErrorRate',
      summaries: summaries.mTotalErrorRate,
      downloadLink
    },
    {
      id: '4xx-error-rate',
      format: 'percentile',
      title: '4xx error rate',
      description:
        'The percentages of HTTP responses with a 4XX HTTP status code, which represents a client error.',
      chart: drawLineGraph(
        'percentage of HTTP requests with a 4XX status code',
        'Percent',
        percentLabel,
        series.m4xxErrorRate
      ),
      units: 'Percent',
      metric: 'm4xxErrorRate',
      summaries: summaries.m4xxErrorRate,
      downloadLink
    },
    {
      id: '5xx-error-rate',
      format: 'percentile',
      title: '5xx error rate',
      description:
        'The percentages of HTTP responses with a 5XX HTTP status code, which represents a server error.',
      chart: drawLineGraph(
        'percentage of HTTP requests with a 5XX status code',
        'Percent',
        percentLabel,
        series.m5xxErrorRate
      ),
      units: 'Percent',
      metric: 'm5xxErrorRate',
      summaries: summaries.m5xxErrorRate,
      downloadLink
    },
    {
      id: 'bytes-uploaded',
      format: 'bytes',
      title: 'Bytes uploaded',
      description:
        'The number of bytes sent to your applications by the CDN route service.',
      chart: drawLineGraph(
        'number of bytes sent to the origin',
        'Bytes',
        bytesLabel,
        series.mBytesUploaded
      ),
      units: 'Bytes',
      metric: 'mBytesUploaded',
      summaries: summaries.mBytesUploaded,
      downloadLink
    },
    {
      id: 'bytes-downloaded',
      format: 'bytes',
      title: 'Bytes downloaded',
      description:
        'The number of bytes received from your applications by the CDN route service.',
      chart: drawLineGraph(
        'number of bytes received from the origin',
        'Bytes',
        bytesLabel,
        series.mBytesDownloaded
      ),
      units: 'Bytes',
      metric: 'mBytesDownloaded',
      summaries: summaries.mBytesDownloaded,
      downloadLink
    }
  ]
}

export function rdsMetrics (
  series: ISeries,
  summaries: ISummaries,
  downloadLink: string
): readonly IMetricProperties[] {
  return [
    {
      id: 'free-disk-space',
      format: 'bytes',
      title: 'Free disk space',
      description: `How much hard disk space your database has remaining. If your database runs out of disk space it
        will stop working.`,
      chart: drawLineGraph(
        'bytes of free disk space',
        'Bytes',
        bytesLabel,
        series.mFreeStorageSpace
      ),
      units: 'Bytes',
      metric: 'mFreeStorageSpace',
      summaries: summaries.mFreeStorageSpace,
      downloadLink
    },
    {
      id: 'cpu-utilisation',
      format: 'percentile',
      title: 'CPU Utilisation',
      description: (
        <>
          How much computational work your database is doing. High CPU
          Utilisation may indicate you need to optimise your database queries or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/postgresql/#upgrade-postgresql-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'percentage CPU Utilisation',
        'Percent',
        percentLabel,
        series.mCPUUtilization
      ),
      units: 'Percent',
      metric: 'mCPUUtilization',
      summaries: summaries.mCPUUtilization,
      downloadLink
    },
    {
      id: 'database-connections',
      title: 'Database Connections',
      description: (
        <>
          How many open connections there are to your database. High values may
          indicate problems with your applications&apos; connection management,
          or that you need to{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/postgresql/#upgrade-postgresql-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          . Zero values may indicate the database is unavailable, or that your
          applications cannot connect to the database.
        </>
      ),
      chart: drawLineGraph(
        'number of database connections',
        'Number',
        numberLabel,
        series.mDatabaseConnections
      ),
      units: 'Number',
      metric: 'mDatabaseConnections',
      summaries: summaries.mDatabaseConnections,
      downloadLink
    },
    {
      id: 'freeable-memory',
      format: 'bytes',
      title: 'Freeable Memory',
      description: (
        <>
          How much <Abbreviation description='Random Access Memory'>RAM</Abbreviation> the{' '}
          <Abbreviation description='Virtual Machine'>VM</Abbreviation> your database is running on
          has remaining. Values near zero may indicate you need to optimise your
          database queries or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/postgresql/#upgrade-postgresql-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'bytes of freeable memory (RAM)',
        'Bytes',
        bytesLabel,
        series.mFreeableMemory
      ),
      units: 'Bytes',
      metric: 'mFreeableMemory',
      summaries: summaries.mFreeableMemory,
      downloadLink
    },
    {
      id: 'read-iops',
      title: (
        <>
          Read <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation>
        </>
      ),
      titleText: 'Read Input / Output Operations per Second',
      description: (
        <>
          How many read operations your database is performing per second.
          Databases are limited to a number of{' '}
          <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation> (read +
          write) based on how big their hard disk is. You get 3{' '}
          <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation> per{' '}
          <Abbreviation description='GibiByte'>GiB</Abbreviation>, so a 100 GiB database would be
          limited to 300 IOPS. If it looks like your database is hitting its
          IOPS limit you may need to{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/postgresql/#upgrade-postgresql-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'number of read IOPS',
        'Number',
        numberLabel,
        series.mReadIOPS
      ),
      units: 'Number',
      metric: 'mReadIOPS',
      summaries: summaries.mReadIOPS,
      downloadLink
    },
    {
      id: 'write-iops',
      title: (
        <>
          Write <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation>
        </>
      ),
      titleText: 'Write Input / Output Operations per Second',
      description: (
        <>
          How many write operations your database is performing per second.
          Databases are limited to a number of{' '}
          <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation> (read +
          write) based on how big their hard disk is. You get 3{' '}
          <Abbreviation description='Input / Output Operations per Second'>IOPS</Abbreviation> per{' '}
          <Abbreviation description='GibiByte'>GiB</Abbreviation>, so a 100 GiB database would be
          limited to 300 IOPS. If it looks like your database is hitting its
          IOPS limit you may need to{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/postgresql/#upgrade-postgresql-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'number of write IOPS',
        'Number',
        numberLabel,
        series.mWriteIOPS
      ),
      units: 'Number',
      metric: 'mWriteIOPS',
      summaries: summaries.mWriteIOPS,
      downloadLink
    }
  ]
}

export function elastiCacheMetrics (
  series: ISeries,
  summaries: ISummaries,
  downloadLink: string
): readonly IMetricProperties[] {
  return [
    {
      id: 'cpu-utilisation',
      format: 'percentile',
      title: 'CPU Utilisation',
      description: (
        <>
          How much computational work redis is doing. High CPU Utilisation may
          indicate you need to reduce your usage or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/redis/#redis-service-plans'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'percentage CPU Utilisation',
        'Percent',
        percentLabel,
        series.mCPUUtilization
      ),
      units: 'Percent',
      metric: 'mCPUUtilization',
      summaries: summaries.mCPUUtilization,
      downloadLink
    },
    {
      id: 'memory-used',
      format: 'bytes',
      title: 'Memory used',
      description: `The total amount of memory redis is using to store your data and redis'
        internal buffers. If redis reaches its memory limit and cannot evict any
        keys it will return errors when executing commands that increase memory
        use.`,
      chart: drawLineGraph(
        'bytes used for the cache',
        'Bytes',
        bytesLabel,
        series.mBytesUsedForCache
      ),
      units: 'Bytes',
      metric: 'mBytesUsedForCache',
      summaries: summaries.mBytesUsedForCache,
      downloadLink
    },
    {
      id: 'swap-memory-used',
      format: 'bytes',
      title: 'Swap memory used',
      description: (
        <>
          If redis is running low on memory it will start to swap memory onto
          the hard disk. If redis is using more than 50{' '}
          <Abbreviation description='MegaBytes'>MB</Abbreviation> of swap memory you may need to
          reduce your usage or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/redis/#redis-service-plans'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'bytes used in swap memory',
        'Bytes',
        bytesLabel,
        series.mSwapUsage
      ),
      units: 'Bytes',
      metric: 'mSwapUsage',
      summaries: summaries.mSwapUsage,
      downloadLink
    },
    {
      id: 'evictions',
      title: 'Evictions',
      description: `Redis will evict keys when it reaches its configured memory limit. It will try to remove less
        recently used keys first, but only among keys that have an EXPIRE set. If there are no keys left to evict
        redis will return errors when executing commands that increase memory use.`,
      chart: drawLineGraph(
        'number of keys evicted by Redis',
        'Number',
        numberLabel,
        series.mEvictions
      ),
      units: 'Number',
      metric: 'mEvictions',
      summaries: summaries.mEvictions,
      downloadLink
    },
    {
      id: 'connection-count',
      title: 'Connection count',
      description: `How many open connections there are to redis. High values may indicate problems with your
        applications'; connection management. Zero values may indicate that redis is unavailable, or that your
        applications cannot connect to the database.`,
      chart: drawLineGraph(
        'number of connections to Redis',
        'Number',
        numberLabel,
        series.mCurrConnections
      ),
      units: 'Number',
      metric: 'mCurrConnections',
      summaries: summaries.mCurrConnections,
      downloadLink
    },
    {
      id: 'cache-hits',
      title: 'Cache hits',
      description: 'The number of successful key lookups.',
      chart: drawLineGraph(
        'number of cache hits',
        'Number',
        numberLabel,
        series.mCacheHits
      ),
      units: 'Number',
      metric: 'mCacheHits',
      summaries: summaries.mCacheHits,
      downloadLink
    },
    {
      id: 'cache-misses',
      title: 'Cache misses',
      description: 'The number of unsuccessful key lookups.',
      chart: drawLineGraph(
        'number of cache misses',
        'Number',
        numberLabel,
        series.mCacheMisses
      ),
      units: 'Number',
      metric: 'mCacheMisses',
      summaries: summaries.mCacheMisses,
      downloadLink
    },
    {
      id: 'item-count',
      title: 'Item count',
      description: 'The number of items in redis.',
      chart: drawLineGraph(
        'number of cache misses',
        'Number',
        numberLabel,
        series.mCurrItems
      ),
      units: 'Number',
      metric: 'mCurrItems',
      summaries: summaries.mCurrItems,
      downloadLink
    },
    {
      id: 'network-bytes-in',
      format: 'bytes',
      title: 'Network bytes in',
      description: 'The number of bytes redis has read from the network.',
      chart: drawLineGraph(
        'number of bytes redis has read from the network',
        'Bytes',
        bytesLabel,
        series.mNetworkBytesIn
      ),
      units: 'Bytes',
      metric: 'mNetworkBytesIn',
      summaries: summaries.mNetworkBytesIn,
      downloadLink
    },
    {
      id: 'network-bytes-out',
      format: 'bytes',
      title: 'Network bytes out',
      description: 'The number of bytes sent by redis.',
      chart: drawLineGraph(
        'number of bytes sent by redis',
        'Bytes',
        bytesLabel,
        series.mNetworkBytesOut
      ),
      units: 'Bytes',
      metric: 'mNetworkBytesOut',
      summaries: summaries.mNetworkBytesOut,
      downloadLink
    }
  ]
}

export function elasticSearchMetrics (
  series: ISeries,
  summaries: ISummaries,
  downloadLink: string
): readonly IMetricProperties[] {
  return [
    {
      id: 'load-average',
      format: 'number',
      title: 'Load average',
      description: (
        <>
          How much computational work elasticsearch is doing. High load average
          may indicate you need to reduce your usage or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/elasticsearch/#upgrade-elasticsearch-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph('load average', 'Load', numberLabel, series.loadAvg),
      units: 'Load',
      metric: 'loadAvg',
      summaries: summaries.loadAvg,
      downloadLink
    },
    {
      id: 'elasticsearch-indices-count',
      format: 'number',
      title: 'Elasticsearch indices count',
      description: (
        <>
          The number of indices present in elasticsearch. Large number of
          indices may indicate a bug in your application or require you to{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/elasticsearch/#upgrade-elasticsearch-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph(
        'elasticsearch indices count',
        'Number',
        numberLabel,
        series.elasticsearchIndicesCount
      ),
      units: 'Number',
      metric: 'elasticsearchIndicesCount',
      summaries: summaries.elasticsearchIndicesCount,
      downloadLink
    },
    {
      id: 'memory',
      format: 'number',
      title: 'Memory usage',
      description: (
        <>
          Percentage of allocated memory elasticsearch is using. High values may
          indicate you need to optimise your elasticsearch queries or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/elasticsearch/#upgrade-elasticsearch-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph('memory', 'Percent', percentLabel, series.memoryUsed),
      units: 'Percent',
      metric: 'memoryUsed',
      summaries: summaries.memoryUsed,
      downloadLink
    },
    {
      id: 'disk-usage',
      format: 'number',
      title: 'Disk usage',
      description: (
        <>
          Percentage of allocated storage elasticsearch is using. If
          elasticsearch runs out of disk space, the service will stop working.
          High values may indicate you need to reduce elasticsearch usage or{' '}
          <a
            href='https://docs.cloud.service.gov.uk/deploying_services/elasticsearch/#upgrade-elasticsearch-service-plan'
            className='govuk-link'
          >
            update your service to use a bigger plan
          </a>
          .
        </>
      ),
      chart: drawLineGraph('disk', 'Percent', percentLabel, series.diskUsed),
      units: 'Percent',
      metric: 'diskUsed',
      summaries: summaries.diskUsed,
      downloadLink
    },
    {
      id: 'disk-reads',
      format: 'number',
      title: 'Disk read rate',
      description:
        'The average number of disk read operations elasticsearch is performing per second.',
      chart: drawLineGraph(
        'disk reads',
        'Reads per second',
        numberLabel,
        series.diskReads
      ),
      units: 'Reads per second',
      metric: 'diskReads',
      summaries: summaries.diskReads,
      downloadLink
    },
    {
      id: 'disk-writes',
      format: 'number',
      title: 'Disk write rate',
      description:
        'The average number of disk write operations elasticsearch is performing per second.',
      chart: drawLineGraph(
        'disk writes',
        'Writes per second',
        numberLabel,
        series.diskWrites
      ),
      units: 'Writes per second',
      metric: 'diskWrites',
      summaries: summaries.diskWrites,
      downloadLink
    },
    {
      id: 'network-in',
      format: 'number',
      title: 'Network in',
      description: 'The number of bytes received by elasticsearch.',
      chart: drawLineGraph(
        'network bytes received',
        'Bytes per second',
        bytesLabel,
        series.networkIn
      ),
      units: 'Bytes per second',
      metric: 'networkIn',
      summaries: summaries.networkIn,
      downloadLink
    },
    {
      id: 'network-out',
      format: 'number',
      title: 'Network out',
      description: 'The number of bytes sent by elasticsearch.',
      chart: drawLineGraph(
        'network bytes send',
        'Bytes per second',
        bytesLabel,
        series.networkOut
      ),
      units: 'Bytes per second',
      metric: 'networkOut',
      summaries: summaries.networkOut,
      downloadLink
    }
  ]
}

export function sqsMetrics (
  series: ISeries,
  summaries: ISummaries,
  downloadLink: string
): readonly IMetricProperties[] {
  return [
    {
      id: 'messages-sent',
      format: 'number',
      title: 'Number of messages sent',
      description: 'The number of messages added to the queue by your applications',
      chart: drawLineGraph(
        'number of messages sent',
        'Messages',
        numberLabel,
        series.mNumberOfMessagesSent
      ),
      units: 'Number',
      metric: 'mNumberOfMessagesSent',
      summaries: summaries.mNumberOfMessagesSent,
      downloadLink
    },
    {
      id: 'messages-recv',
      format: 'number',
      title: 'Number of messages received',
      description: 'The number of messages consumed from the queue by your applications',
      chart: drawLineGraph(
        'number of messages received',
        'Messages',
        numberLabel,
        series.mNumberOfMessagesReceived
      ),
      units: 'Number',
      metric: 'mNumberOfMessagesReceived',
      summaries: summaries.mNumberOfMessagesReceived,
      downloadLink
    }
  ]
}
