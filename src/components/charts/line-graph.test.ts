import { IMetricSerie } from '../../lib/metrics';
import { numberLabel } from '../service-metrics/metrics';

import { drawLineGraph, summariseSerie } from './line-graph';

const defaultTitle = 'some title';
const defaultUnits = 'some-units';
const defaultFormat = numberLabel;

describe('line graphs', () => {
  it('should render an SVG', () => {
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, []);
    expect(result.nodeName).toBe('SVG');
  });

  it('should render an a title id attribute whose value matches a spaceless defaultTitle', () => {
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, []);
    const titleID = result.querySelector('title')?.getAttribute('id');
    expect(titleID).toBe('sometitle');
  });

  it('should render an aria-labelledby attribute whose value that matches spaceless defaultTitle', () => {
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, []);
    const ariaAttr = result.getAttribute('aria-labelledby');
    expect(ariaAttr).toBe('sometitle');
  });

  it('should an SVG with a role of img', () => {
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, []);
    const ariaAttr = result.getAttribute('role');
    expect(ariaAttr).toBe('img');
  });

  it('should render a single series as a path and not show a legend', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 58 },
      { date: new Date(2019, 2, 1), value: 42 },
      { date: new Date(2019, 3, 1), value: 53 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { label: 'some-label', metrics: series },
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
      { label: 'some-label-001', metrics: series },
      { label: 'some-label-002', metrics: series },
      { label: 'some-label-003', metrics: series },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
  });

  it('should render multiple series as multiple paths and show a legend with provided labels', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 42 },
      { date: new Date(2019, 2, 1), value: 58 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { label: 'some-label-one', metrics: series },
      { label: 'some-label-two', metrics: series },
      { label: 'some-label-three', metrics: series },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
    expect(legends[0].innerHTML).toContain('some-label-one');
    expect(legends[1].innerHTML).toContain('some-label-two');
    expect(legends[2].innerHTML).toContain('some-label-three');
  });

  it('should show a graph legend with default labels', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 42 },
      { date: new Date(2019, 2, 1), value: 58 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { label: 'some-label-1', metrics: series },
      { label: 'some-label-2', metrics: series },
      { label: 'some-label-3', metrics: series },
    ]);
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
    expect(legends[0].innerHTML).toContain('Instance 1');
    expect(legends[1].innerHTML).toContain('Instance 2');
    expect(legends[2].innerHTML).toContain('Instance 3');
  });

  it('should not show a graph legend when no label is provided', () => {
    const series = [
      { date: new Date(2019, 1, 1), value: 42 },
      { date: new Date(2019, 2, 1), value: 58 },
    ];
    const result = drawLineGraph(defaultTitle, defaultUnits, defaultFormat, [
      { metrics: series },
      { metrics: series },
      { metrics: series },
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
      { date: new Date('2020-01-01\'T\'00:00:00'), value: 90 },
      { date: new Date('2020-01-01\'T\'01:00:00'), value: 32 },
      { date: new Date('2020-01-01\'T\'02:00:00'), value: 56 },
      { date: new Date('2020-01-01\'T\'03:00:00'), value: 12 },
      { date: new Date('2020-01-01\'T\'04:00:00'), value: 2 },
      { date: new Date('2020-01-01\'T\'05:00:00'), value: 94 },
      { date: new Date('2020-01-01\'T\'06:00:00'), value: 73 },
      { date: new Date('2020-01-01\'T\'07:00:00'), value: NaN },
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
