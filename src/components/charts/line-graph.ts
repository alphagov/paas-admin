import { extent, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleTime } from 'd3-scale';
import { select } from 'd3-selection';
import { line } from 'd3-shape';
import { format } from 'date-fns';
import { Window } from 'happy-dom';
import { flatMap } from 'lodash-es';

import { IMetric, IMetricSerie, IMetricSerieSummary } from '../../lib/metrics';



export function drawLineGraph(
  title: string,
  units: string,
  formatter: (domainValue: any, index: number) => string,
  series: ReadonlyArray<IMetricSerie>,
): SVGElement {
  
  // move inside the function so that each graph has it's down height based on number of items
  const padding = {
    bottom: 132,
    left: 90,
    right: 30,
    top: 25,
  };
  let viewBox = {
    height: 320,
    width: 960,
    x: 0,
    y: 0,
  };
  const { window } = new Window();
  const { document } = window;
  //c onvert to correct dom element from generic IHTMLElement
  const body = <HTMLBodyElement> <unknown> document.body;

  const itemID = title.replace(/\s/g, '');
  const svg = select(body)
    .append('svg')
    .attr('class', 'govuk-paas-line-graph')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('role', 'img')
    .attr('aria-labelledby', itemID);

  const rawxAxisExtent = extent(
    flatMap(series, s => s.metrics),
    d => d.date,
  ) as readonly [Date, Date];

  const xAxisExtent = series.length > 0 ? rawxAxisExtent : [new Date(), new Date()];

  const start = new Date(xAxisExtent[0]);
  const end = new Date(xAxisExtent[1]);

  const dateFormat = 'h:mmaaa \'on\' d MMMM yyyy';

  svg
    .append('title')
    .attr('id', itemID)
    .text(
      `Line graph showing ${title} from ${format(start, dateFormat)} to ${format(end, dateFormat)}`,
    );

  const yAxisMax = max(
    flatMap(series, s => s.metrics),
    d => d.value,
  ) as number;

  const xScale = scaleTime()
    .domain(xAxisExtent)
    .range([viewBox.x + padding.left, viewBox.width - padding.right]);
  const yScale = scaleLinear()
    .domain([0, yAxisMax * 1.25 ])
    .range([viewBox.height - padding.bottom, viewBox.y + padding.top]);

  const drawLine = line<IMetric>()
    .defined(d => !isNaN(d.value))
    .x(d => xScale(d.date))
    .y(d => yScale(d.value));

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
        .tickFormat(formatter),
    );

  svg.append('g')
    .attr('class', 'grid horizontal')
    .attr('transform', `translate(${padding.left})`)
    .attr('aria-hidden', 'true')
    .call(
      axisLeft(yScale)
        .ticks(5)
        .tickSize(-(viewBox.width - padding.left - padding.right))
        .tickFormat(() => ''),
    );

  series.forEach((serie, i) => {
    svg
      .append('path')
      .datum(serie.metrics as ReadonlyArray<IMetric>)
      .attr('d', drawLine)
      .attr('class', `series series-${i}`)
      .attr('aria-hidden', 'true');

    if (series.length > 1) {
      const serieLabel = serie.label ? serie.label : '';
      const matches = serieLabel.match(/-(\d+$)/) ;
      const legendLabel = matches ? `Instance ${matches[1]}` : `${serieLabel}`;
      //adjust SVG viewBox based on number of items to that Legend items have room to stack
      viewBox.height+=30
      padding.bottom+=30

      if (legendLabel && legendLabel.length > 1) {
        const legendGroup = svg
          .append('g')
          .attr('class', `legend legend-${i}`)
          .attr('aria-hidden', 'true')
          .attr(
            'transform',
            `translate(${padding.left}, ${320 + i*30})`,
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
          .text(legendLabel);
      }
    }
  });

  svg.append('g')
    .attr('class', 'grid vertical')
    .attr('transform', `translate(0,${viewBox.height - padding.bottom})`)
    .attr('aria-hidden', 'true')
    .call(
      axisBottom(xScale)
        .tickSize(-(viewBox.height - padding.bottom - padding.top))
        .tickFormat(() => ''),
    );

  svg
    .append('g')
    .attr('class', 'axis bottom')
    .attr('transform', `translate(0, ${viewBox.height - padding.bottom})`)
    .attr('aria-hidden', 'true')
    .call(axisBottom(xScale))
    .selectAll('text')
    .attr('y', 8)
    .attr('x', -8)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(-45)')

  svg
    .append('text')
    .attr('class', 'label bottom')
    .attr('y', `${viewBox.height - padding.bottom + 30}`)
    .attr('x', viewBox.width - 50)
    .attr('aria-hidden', 'true')
    .text('Time');

  svg
  .attr(
    'viewBox',
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
  )

  const svgNode = svg.node();
  /* istanbul ignore if */
  if (!svgNode) {
    throw new Error('failed to build SVG - this should never happen');
  }

  return svgNode;
}

export function summariseSerie(serie: IMetricSerie): IMetricSerieSummary {
  /* istanbul ignore next */
  const matches = (serie.label || '').match(/-(\d{3})/);

  /* istanbul ignore next */
  const label = matches && matches.length > 1 ? matches[1] : serie.label || '';

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
    average: averageMetric,
    label,
    latest: latestMetric,
    max: maxMetric,
    min: minMetric,
  };

  return summary;
}
