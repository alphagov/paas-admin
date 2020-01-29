import { extent, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { format as d3Format } from 'd3-format';
import { scaleLinear, scaleTime } from 'd3-scale';
import { select } from 'd3-selection';
import { line } from 'd3-shape';
import { JSDOM } from 'jsdom';
import { flatMap } from 'lodash';
import moment from 'moment';

import { IMetric, IMetricSerie, IMetricSerieSummary } from '../../lib/metrics';

const viewBox = {
  x: 0,
  y: 0,
  width: 960,
  height: 320,
};

const padding = {
  top: 25,
  right: 30,
  bottom: 132,
  left: 50,
};

export function drawLineGraph(
  title: string,
  units: string,
  format: string,
  series: ReadonlyArray<IMetricSerie>,
): SVGElement {
  const jsdom = new JSDOM();
  const { window } = jsdom;
  const { document } = window;
  const { body } = document;

  const svg = select(body)
    .append('svg')
    .attr('class', 'govuk-paas-line-graph')
    .attr(
      'viewBox',
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    )
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('role', 'figure')
    .attr('aria-labelledby', 'title');

  const xAxisExtent = extent(
    flatMap(series, s => s.metrics),
    d => d.date,
  ) as [Date, Date];

  const start = moment(xAxisExtent[0]);
  const end = moment(xAxisExtent[1]);
  const dateFormat = 'h:mma on D MMMM YYYY';

  svg
    .append('title')
    .text(
      `Line graph showing ${title} from ${start.format(
        dateFormat,
      )} to ${end.format(dateFormat)}`,
    );

  const yAxisMax = max(
    flatMap(series, s => s.metrics),
    d => d.value,
  ) as number;

  const xScale = scaleTime()
    .domain(xAxisExtent)
    .range([viewBox.x + padding.left, viewBox.width - padding.right]);
  const yScale = scaleLinear()
    .domain([0, yAxisMax])
    .range([viewBox.height - padding.bottom, viewBox.y + padding.top]);

  const drawLine = line<IMetric>()
    .defined(d => !isNaN(d.value))
    .x(d => xScale(d.date))
    .y(d => yScale(d.value));

  series.forEach((serie, i) => {
    svg
      .append('path')
      .datum(serie.metrics as Array<IMetric>)
      .attr('d', drawLine)
      .attr('class', `series series-${i}`)
      .attr('aria-hidden', 'true');

    if (series.length > 1) {
      const matches = serie.label.match(/-(\d+$)/);
      if (matches && matches.length > 1) {
        const legendGroup = svg
          .append('g')
          .attr('class', `legend legend-${i}`)
          .attr('aria-hidden', 'true')
          .attr(
            'transform',
            `translate(${padding.left + 120 * i}, ${viewBox.height - 30})`,
          );

        legendGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', -10)
          .attr('width', 10)
          .attr('height', 10);

        legendGroup
          .append('text')
          .attr('x', 20)
          .attr('y', 0)
          .text(`Instance ${matches[1]}`);
      }
    }
  });

  svg
    .append('g')
    .attr('class', 'axis bottom')
    .attr('transform', `translate(0, ${viewBox.height - padding.bottom})`)
    .attr('aria-hidden', 'true')
    .call(axisBottom<Date>(xScale))
    .selectAll('text')
    .attr('y', 8)
    .attr('x', -8)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg
    .append('text')
    .attr('class', 'label left')
    .attr('y', viewBox.height - 30)
    .attr('x', viewBox.width - 50)
    .attr('aria-hidden', 'true')
    .text('Time');

  svg
    .append('text')
    .attr('class', 'label left')
    .attr('y', 15)
    .attr('x', 0)
    .attr('aria-hidden', 'true')
    .text(units);

  svg
    .append('g')
    .attr('class', 'axis left')
    .attr('transform', `translate(${viewBox.x + padding.left})`)
    .attr('aria-hidden', 'true')
    .call(
      axisLeft(yScale)
        .ticks(5)
        .tickFormat(d3Format(format)),
    );

  const svgNode = svg.node();
  /* istanbul ignore if */
  if (!svgNode) {
    throw new Error('failed to build SVG - this should never happen');
  }

  return svgNode;
}

export function summariseSerie(serie: IMetricSerie): IMetricSerieSummary {
  const matches = serie.label.match(/-(\d{3})/);

  const label = matches && matches.length > 1 ? matches[1] : serie.label;

  const latestMetric = serie.metrics.reduce(
    (value, m) => (!isNaN(m.value) ? m.value : value),
    0,
  );
  const maxMetric = serie.metrics.reduce(
    (value, m) => (m.value > value ? m.value : value),
    0,
  );
  const minMetric = serie.metrics.reduce(
    (value, m) => (m.value < value ? m.value : value),
    maxMetric,
  );
  const averageMetric =
    serie.metrics.reduce((total, m) => total + (m.value || 0), 0) /
    serie.metrics.filter(m => !isNaN(m.value)).length;

  const summary = {
    label,
    latest: latestMetric,
    average: averageMetric,
    min: minMetric,
    max: maxMetric,
  };

  return summary;
}
