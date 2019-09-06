export const timeOffsets: {readonly [key: string]: number} = {
  'last-15-minutes': 15 * 60,
  'last-1-hour': 60 * 60,
  'last-4-hours': 4 * 60 * 60,
  'last-12-hours': 12 * 60 * 60,
  'last-24-hours': 24 * 60 * 60,
  'last-2-days': 2 * 24 * 60 * 60,
  'last-7-days': 7 * 24 * 60 * 60,
};

export const numPointsOnSmallChart = 45;

export const prometheusTimeInterval = (intervalMillis: number): string => {
  const intervalSeconds = parseInt((intervalMillis / 1000).toFixed(0), 10);

  const oneMinute = 60;
  const oneHour = 60 * oneMinute;
  const twentyFourHours = 24 * oneHour;
  const sevenDays = 7 * twentyFourHours;

  if (intervalSeconds < oneMinute) {
    throw new Error('Out of bounds: interval too short');
  }

  if (intervalSeconds > sevenDays) {
    throw new Error('Out of bounds: interval too long');
  }

  if (intervalSeconds < oneHour) {
    return `${ (intervalSeconds / oneMinute).toFixed(0) }m`;
  }

  return `${ (intervalSeconds / oneHour).toFixed(0) }h`;
};

export type PrometheusInterval = string;

export type PrometheusSingleStatQuery = string;
export type PrometheusSingleStatQueryBuilder = (
  sourceID: string, interval: PrometheusInterval,
) => PrometheusSingleStatQuery;

export type PrometheusSingleSeriesQuery = string;
export type PrometheusSingleSeriesQueryBuilder = (
  sourceID: string,
) => PrometheusSingleSeriesQuery;

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

export const rdsFreeStorageSpaceSingleStat = (
  sourceID: string,
): PrometheusSingleStatQuery => `
avg by (source_id) (
  free_storage_space{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();

export const rdsFreeStorageSpaceAggregatedSeries = (
  sourceID: string,
): PrometheusSingleStatQuery => `
avg by (source_id) (
  free_storage_space{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();

export const rdsCPUUsageAggregatedSeries = (
  sourceID: string,
): PrometheusSingleStatQuery => `
avg by (source_id) (
  cpu{source_id="${sourceID}"}
)
`.replace(/\s+/m, ' ').trim();

export const appSingleStats: { readonly [key: string]: PrometheusSingleStatQueryBuilder } = {
  'app-http-reliability-aggregated-singlestat': appHTTPReliabilitySingleStat,
  'app-http-latency-aggregated-singlestat': appHTTPLatencySingleStat,
};

export const appSingleSeries: { readonly [key: string]: PrometheusSingleSeriesQueryBuilder } = {
  'app-http-count-1xx-series': (sourceID: string) => appHTTPCountSegmentedSeries(sourceID, 1),
  'app-http-count-2xx-series': (sourceID: string) => appHTTPCountSegmentedSeries(sourceID, 2),
  'app-http-count-3xx-series': (sourceID: string) => appHTTPCountSegmentedSeries(sourceID, 3),
  'app-http-count-4xx-series': (sourceID: string) => appHTTPCountSegmentedSeries(sourceID, 4),
  'app-http-count-5xx-series': (sourceID: string) => appHTTPCountSegmentedSeries(sourceID, 5),
  'app-http-count-aggregated-series': appHTTPCountAggregatedSeries,

  'app-http-latency-1xx-series': (sourceID: string) => appHTTPLatencySegmentedSeries(sourceID, 1),
  'app-http-latency-2xx-series': (sourceID: string) => appHTTPLatencySegmentedSeries(sourceID, 2),
  'app-http-latency-3xx-series': (sourceID: string) => appHTTPLatencySegmentedSeries(sourceID, 3),
  'app-http-latency-4xx-series': (sourceID: string) => appHTTPLatencySegmentedSeries(sourceID, 4),
  'app-http-latency-5xx-series': (sourceID: string) => appHTTPLatencySegmentedSeries(sourceID, 5),
  'app-http-latency-aggregated-series': appHTTPLatencyAggregatedSeries,

  'app-cpu-usage-aggregated-series': appCPUUsageAggregatedSeries,
  'app-memory-usage-aggregated-series': appMemoryUsageAggregatedSeries,
  'app-disk-usage-aggregated-series': appDiskUsageAggregatedSeries,
};

export const rdsSingleStats: { readonly [key: string]: PrometheusSingleStatQueryBuilder } = {
  'rds-free-storage-space-aggregated-singlestat': rdsFreeStorageSpaceSingleStat,
};

export const rdsSingleSeries: { readonly [key: string]: PrometheusSingleSeriesQueryBuilder } = {
  'rds-cpu-usage-aggregated-series': rdsCPUUsageAggregatedSeries,
  'rds-free-storage-space-aggregated-series': rdsFreeStorageSpaceAggregatedSeries,
};
