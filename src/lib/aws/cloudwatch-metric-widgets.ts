import { getElasticacheReplicationGroupId, getRdsDbInstanceIdentifier } from '../../lib/aws/identifiers';

interface IMetricWidget {
  yAxis?: {left: {min: number, label?: string, showUnits?: boolean}};
  start?: string;
  title?: string;
  legend?: {position: 'bottom' | 'right' | 'hidden'};
  metrics: ReadonlyArray<ReadonlyArray<string | {expression: string, label: string}>>;
}

interface IMetricDimension {
  name: string;
  units: 'bytes' | 'percent' | 'number';
}

const defaultMetricWidget: IMetricWidget = {
  yAxis: {left: { min: 0} },
  start: '-PT24H',
  title: ' ',
  legend: {position: 'hidden'},
  metrics: [[]],
};

function getMetricDimension(unsanitisedMetricDimension: string): IMetricDimension {
  const supportedDimensions: {[key: string]: IMetricDimension | undefined} = {
    CPUUtilization:      {name: 'CPUUtilization'     , units: 'percent'},
    CacheHits:           {name: 'CacheHits'          , units: 'number'},
    CacheMisses:         {name: 'CacheMisses'        , units: 'number'},
    CurrConnections:     {name: 'CurrConnections'    , units: 'number'},
    CurrItems:           {name: 'CurrItems'          , units: 'number'},
    DatabaseConnections: {name: 'DatabaseConnections', units: 'number'},
    Evictions:           {name: 'Evictions'          , units: 'number'},
    ReadIOPS:            {name: 'ReadIOPS'           , units: 'number'},
    WriteIOPS:           {name: 'WriteIOPS'          , units: 'number'},
    BytesUsedForCache:   {name: 'BytesUsedForCache'  , units: 'bytes'},
    FreeStorageSpace:    {name: 'FreeStorageSpace'   , units: 'bytes'},
    FreeableMemory:      {name: 'FreeableMemory'     , units: 'bytes'},
    NetworkBytesIn:      {name: 'NetworkBytesIn'     , units: 'bytes'},
    NetworkBytesOut:     {name: 'NetworkBytesOut'    , units: 'bytes'},
    SwapUsage:           {name: 'SwapUsage'          , units: 'bytes'},
  };
  const dimension = supportedDimensions[unsanitisedMetricDimension];
  if (!dimension) {
    throw new Error(`metric dimension ${unsanitisedMetricDimension} is not supported`);
  }
  return dimension;
}

function getRdsMetricWidget(unsanitizedMetricDimension: string, serviceInstanceGUID: string): IMetricWidget {
  return {
    ...defaultMetricWidget,
    metrics: [[
      'AWS/RDS', getMetricDimension(unsanitizedMetricDimension).name,
      'DBInstanceIdentifier', getRdsDbInstanceIdentifier(serviceInstanceGUID),
    ]],
  };
}

function getElastiCacheMetricWidget(unsanitizedMetricDimension: string, serviceInstanceGUID: string): IMetricWidget {
  const replicationGroupId = getElasticacheReplicationGroupId(serviceInstanceGUID);
  const metricDimension = getMetricDimension(unsanitizedMetricDimension);
  const search = `SEARCH('{AWS/ElastiCache,CacheClusterId} MetricName="${metricDimension.name}" AND ${replicationGroupId}', 'Average', 300)`;
  return {
    ...defaultMetricWidget,
    legend: { position: 'bottom' },
    yAxis: {
      left: {
        label: metricDimension.units,
        showUnits: false,
        min: 0,
      },
    },
    metrics: [
      [ { expression: search, label: '' } ],
    ],
  };
}

export function getMetricWidget(
    serviceLabel: string,
    metricDimension: string,
    serviceInstanceGUID: string): IMetricWidget {
  switch (serviceLabel) {
    case 'postgres':
    case 'mysql':
      return getRdsMetricWidget(metricDimension, serviceInstanceGUID);
    case 'redis':
      return getElastiCacheMetricWidget(metricDimension, serviceInstanceGUID);
    default:
      throw new Error(`metric images not supported for service type ${serviceLabel}`);
  }
}
