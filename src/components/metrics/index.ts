type PrometheusInterval = string;

type PrometheusSingleStatQuery = string;
type PrometheusSingleSeriesQuery = string;

export const appHTTPReliabilitySingleStat = (
  sourceID: string,
  interval: PrometheusInterval,
): PrometheusSingleStatQuery => `
100 * (
  sum (
    sum by (source_id) (
      sum_over_time(
        http_count{source_id="${sourceID}", status_code=~"[1-3].."}[${interval}]
      )
    )
    or vector(0)
  )
  /
  sum (
    sum by (source_id) (
      sum_over_time(
        http_count{source_id="${sourceID}"}[${interval}]
      )
    )
  )
  or vector(1)
)
`
.replace(/\s+/m, ' ').trim();

export const appHTTPLatencySingleStat = (
  sourceID: string,
  interval: PrometheusInterval,
): PrometheusSingleSeriesQuery => `
sum(
  avg by (source_id) (
    avg_over_time(
      http_mean_ms{source_id="${sourceID}"}[${interval}]
    )
  )
  or vector(0)
)
`.replace(/\s+/m, ' ').trim();

export const appHTTPCountSegmentedSeries = (
  sourceID: string,
  hundred: number,
): PrometheusSingleSeriesQuery => `
sum (
  http_count{source_id="${sourceID}", status_code=~"${hundred}.."}
  or vector(0)
)
`.replace(/\s+/m, ' ').trim();

export const appHTTPCountAggregatedSeries = (
  sourceID: string,
): PrometheusSingleStatQuery => `
sum (
  http_count{source_id="${sourceID}"}
  or vector(0)
)
`.replace(/\s+/m, ' ').trim();

export const appHTTPLatencySegmentedSeries = (
  sourceID: string,
  hundred: number,
): PrometheusSingleSeriesQuery => `
sum (
  http_mean_ms{source_id="${sourceID}", status_code=~"${hundred}.."}
  or vector(0)
)
`.replace(/\s+/m, ' ').trim();

export const appHTTPLatencyAggregatedSeries = (
  sourceID: string,
): PrometheusSingleSeriesQuery => `
sum (
  avg (http_mean_ms{source_id="${sourceID}"})
  or vector(0)
)
`.replace(/\s+/m, ' ').trim();

export const appCPUUsageAggregatedSeries = (
  sourceID: string,
): PrometheusSingleSeriesQuery => `
100 * avg by (source_id) (
  cpu{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();

export const appMemoryUsageAggregatedSeries = (
  sourceID: string,
): PrometheusSingleSeriesQuery => `
100 * avg by (source_id) (
  memory{source_id="${sourceID}"}
  /
  memory_quota{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();

export const appDiskUsageAggregatedSeries = (
  sourceID: string,
): PrometheusSingleSeriesQuery => `
100 * avg by (source_id) (
  disk{source_id="${sourceID}"}
  /
  disk_quota{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();
