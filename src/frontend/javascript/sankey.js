'use strict'

const dataElem = document.getElementById('data')
const data = JSON.parse(dataElem.textContent)
const svgElem = document.getElementById('sankey')
const svg = d3.select(svgElem)

const width = svgElem.clientWidth
const height = svgElem.clientHeight

const sankey = d3
  .sankey()
  .nodeAlign(d3.sankeyLeft)
  .nodeWidth(15)
  .nodePadding(14)
  .extent([
    [1, 5],
    [width - 1, height - 5]
  ])

const _sankey = sankey(data)
const nodes = _sankey.nodes
const links = _sankey.links

const DOM = {
  count: 0,
  uid: function uid (name) {
    return `O-${name == null ? '' : `${name}-`}${++this.count}`
  }
}
const f = d3.format(',.2f')

const format = function format (d) {
  return `\xA3${f(d)}`
}

const govukColours = [
  '#28a197',
  '#912b88',
  '#f499be',
  '#2b8cc4',
  '#ffbf47',
  '#d53880',
  '#85994b',
  '#b58840',
  '#006435',
  '#6f72af',
  '#005ea5',
  '#df3034',
  '#b10e1e',
  '#2e358b',
  '#f47738'
]
const color = d3.scaleOrdinal(govukColours)

svg
  .append('g')
  .attr('stroke', '#000')
  .selectAll('rect')
  .data(nodes)
  .join('rect')
  .attr('x', function (d) {
    return d.x0
  })
  .attr('y', function (d) {
    return d.y0
  })
  .attr('height', function (d) {
    return d.y1 - d.y0
  })
  .attr('width', function (d) {
    return d.x1 - d.x0
  })
  .attr('fill', function (d) {
    return color(d.name)
  })

const link = svg
  .append('g')
  .attr('fill', 'none')
  .attr('stroke-opacity', 0.5)
  .selectAll('g')
  .data(links)
  .join('g')
  .style('mix-blend-mode', 'multiply')

const gradient = link
  .append('linearGradient')
  .attr('id', function (d) {
    return (d.uid = DOM.uid('link'))
  })
  .attr('gradientUnits', 'userSpaceOnUse')
  .attr('x1', function (d) {
    return d.source.x1
  })
  .attr('x2', function (d) {
    return d.target.x0
  })

gradient
  .append('stop')
  .attr('offset', '0%')
  .attr('stop-color', function (d) {
    return color(d.source.name)
  })

gradient
  .append('stop')
  .attr('offset', '100%')
  .attr('stop-color', function (d) {
    return color(d.target.name)
  })

link
  .append('path')
  .attr('d', d3.sankeyLinkHorizontal())
  .attr('stroke', function (d) {
    return `url(#${d.uid})`
  })
  .attr('stroke-width', function (d) {
    return d.width
  })

link.append('title').text(function (d) {
  return `${d.source.name} \u2192 ${d.target.name}\n${format(d.value)}`
})

svg
  .append('g')
  .style('font', '14px sans-serif')
  .selectAll('text')
  .data(nodes)
  .join('text')
  .attr('x', function (d) {
    return d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6
  })
  .attr('y', function (d) {
    return (d.y1 + d.y0) / 2
  })
  .attr('dy', '0.35em')
  .attr('text-anchor', function (d) {
    return d.x0 < width / 2 ? 'start' : 'end'
  })
  .text(function (d) {
    return `${d.name} (${format(d.value)})`
  })
