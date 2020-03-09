import { IMetricSerie } from '../../lib/metrics';

import { drawLineGraph, summariseSerie } from './line-graph';

const defaultTitle = 'some title';
const defaultUnits = 'some-units';
const defaultFormat = '.1s';

describe('line graphs', () => {
  it('should render an SVG', () => {
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, []);
    expect(result.nodeName).toBe('svg');
  });

  it('should render a single series as a path and not show a legend', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 58 },
      { date: new Date(2019, 2, 1), value: 42 },
      { date: new Date(2019, 3, 1), value: 53 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { metrics: series, label: 'some-label' },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(1);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(0);
  });

  it('should render multiple series as multiple paths and show a legend', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 42 },
      { date: new Date(2019, 2, 1), value: 58 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { metrics: series, label: 'some-label-001' },
      { metrics: series, label: 'some-label-002' },
      { metrics: series, label: 'some-label-003' },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
  });

  it('should render multiple series as multiple paths and not show a legend if the formats do not end with numbers', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 42 },
      { date: new Date(2019, 2, 1), value: 58 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { metrics: series, label: 'some-label-one' },
      { metrics: series, label: 'some-label-two' },
      { metrics: series, label: 'some-label-three' },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(0);
  });
});

describe(summariseSerie, () => {
  const metricSerie: IMetricSerie = {
    label: 'cf-0aaa00aaaa0aa-002 MetricName',
    metrics: [
      { date: new Date('2020-01-01[T]00:00:00'), value: 90 },
      { date: new Date('2020-01-01[T]01:00:00'), value: 32 },
      { date: new Date('2020-01-01[T]02:00:00'), value: 56 },
      { date: new Date('2020-01-01[T]03:00:00'), value: 12 },
      { date: new Date('2020-01-01[T]04:00:00'), value: 2 },
      { date: new Date('2020-01-01[T]05:00:00'), value: 94 },
      { date: new Date('2020-01-01[T]06:00:00'), value: 73 },
      { date: new Date('2020-01-01[T]07:00:00'), value: NaN },
    ],
  };

  it('should generate summary correctly', () => {
    const summary = summariseSerie(metricSerie);

    expect(summary.label).toEqual('002');
    expect(summary.max).toEqual(94);
    expect(summary.min).toEqual(2);
    expect(summary.average.toFixed(2)).toEqual('51.29');
    expect(summary.latest).toEqual(73);
  });

  it('should fallback to default label if cannot match pattern', () => {
    const summary = summariseSerie({ ...metricSerie, label: 'cf MetricName' });

    expect(summary.label).toEqual('cf MetricName');
  });
});
