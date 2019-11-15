import {drawLineGraph, drawMultipleLineGraphs} from './line-graph';

const defaultGraphData = {
  seriesArray: [],
  id: 'some-id',
  format: '.1s',
  units: 'some-units',
  title: 'some title',
};

describe('line graphs', () => {
  it('should render an SVG', () => {
    const result = drawLineGraph({...defaultGraphData});
    expect(result.nodeName).toBe('svg');
  });

  it('should render a single series as a path and not show a legend', () => {
    const series = [
      {date: new Date(2019, 1, 1), value: 42},
      {date: new Date(2019, 2, 1), value: 58},
    ];
    const result = drawLineGraph({
      ...defaultGraphData,
      seriesArray: [
        { metrics: series, label: 'some-label'},
      ],
    });
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(1);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(0);
  });

  it('should render multiple series as multiple paths and show a legend', () => {
    const series = [
      {date: new Date(2019, 1, 1), value: 42},
      {date: new Date(2019, 2, 1), value: 58},
    ];
    const result = drawLineGraph({
      ...defaultGraphData,
      seriesArray: [
        { metrics: series, label: 'some-label-001'},
        { metrics: series, label: 'some-label-002'},
        { metrics: series, label: 'some-label-003'},
      ],
    });
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
  });

  // tslint:disable:max-line-length
  it('should render multiple series as multiple paths and not show a legend if the formats do not end with numbers', () => {
    const series = [
      {date: new Date(2019, 1, 1), value: 42},
      {date: new Date(2019, 2, 1), value: 58},
    ];
    const result = drawLineGraph({
      ...defaultGraphData,
      seriesArray: [
        { metrics: series, label: 'some-label-one'},
        { metrics: series, label: 'some-label-two'},
        { metrics: series, label: 'some-label-three'},
      ],
    });
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(0);
  });

  it('should render multiple line graphs', () => {
    const series = [
      {date: new Date(2019, 1, 1), value: 42},
      {date: new Date(2019, 2, 1), value: NaN},
      {date: new Date(2019, 3, 1), value: 58},
    ];
    const graphs = [
      {
        seriesArray: [{ metrics: series, label: 'some-label' }],
        format: '.1s',
        id: 'some-id',
        units: 'some-units',
        title: 'some title',
      },
      {
        seriesArray: [{ metrics: series, label: 'some-label' }],
        format: '.1s',
        id: 'some-other-id',
        units: 'some-other-units',
        title: 'some title',
      },
    ];
    const result = drawMultipleLineGraphs(graphs);
    expect(result['some-id'].graph).toMatch(/^<svg/);
    expect(result['some-other-id'].graph).toMatch(/^<svg/);
  });
});
