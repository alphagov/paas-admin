import {drawLineGraph} from './line-graph';

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
      {date: new Date(2019, 1, 1), value: 58},
      {date: new Date(2019, 2, 1), value: 42},
      {date: new Date(2019, 3, 1), value: 53},
    ];
    const result = drawLineGraph(
      defaultTitle, defaultUnits, defaultFormat,
      [
        { metrics: series, label: 'some-label'},
      ],
    );
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
    const result = drawLineGraph(
      defaultTitle, defaultUnits, defaultFormat,
      [
        { metrics: series, label: 'some-label-001'},
        { metrics: series, label: 'some-label-002'},
        { metrics: series, label: 'some-label-003'},
      ],
    );
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(3);
  });

  // tslint:disable:max-line-length
  it('should render multiple series as multiple paths and not show a legend if the formats do not end with numbers', () => {
    // tslint:enable:max-line-length
    const series = [
      {date: new Date(2019, 1, 1), value: 42},
      {date: new Date(2019, 2, 1), value: 58},
    ];
    const result = drawLineGraph(
      defaultTitle, defaultUnits, defaultFormat,
      [
        { metrics: series, label: 'some-label-one'},
        { metrics: series, label: 'some-label-two'},
        { metrics: series, label: 'some-label-three'},
      ],
    );
    const seriesPaths = result.querySelectorAll('path.series');
    expect(seriesPaths).toHaveLength(3);
    const legends = result.querySelectorAll('.legend');
    expect(legends).toHaveLength(0);
  });
});
