(function() {
  var dataPath = window.location.pathname + '.json';

  fetch(dataPath).then(function(response) {
    console.info(response);
    return response.json();
  }).then(function(response) {
    console.info(response);

    if (typeof response.values.httpReliability !== 'undefined') {
      document
        .querySelector('#http-reliability-value')
        .innerText = parseFloat(response.values.httpReliability).toFixed(1);
    }

    if (typeof response.values.latency !== 'undefined') {
      document
        .querySelector('#latency-value')
        .innerText = parseFloat(response.values.latency).toFixed(1);
    }

    if (typeof response.values.freeStorageSpace !== 'undefined') {
      document
        .querySelector('#free-storage-space-value')
        .innerText = parseFloat(response.values.freeStorageSpace/ (1024 * 1024)).toFixed(1);
    }

    var env = muze();
    var DataModel = muze.DataModel;
    var html = muze.Operators.html;
    var DateTimeFormatter = muze.utils.DateTimeFormatter;
    var height = 275;

    var govukLightBlue = '#5694ca';
    var govukBlue = '#1d70b8';
    var govukDarkBlue = '#003078';
    var govukOrange = '#f47738';
    var govukRed = '#d4351c';

    var http1xxColor = govukLightBlue;
    var http2xxColor = govukBlue;
    var http3xxColor = govukDarkBlue;
    var http4xxColor = govukOrange;
    var http5xxColor = govukRed;

    var singleChartColor = govukBlue;
    var httpColorRange = [
      http1xxColor, http2xxColor, http3xxColor,
      http4xxColor, http5xxColor,
    ];

    if (typeof response.series.httpTotalCountSeries !== 'undefined') {
      env
        .canvas()
        .data(new muze.DataModel(
          [['Code', 'Timestamp','Value']].concat(
            response.series.http1xxCountSeries.map(
              (p) => ['1XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http2xxCountSeries.map(
              (p) => ['2XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http3xxCountSeries.map(
              (p) => ['3XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http4xxCountSeries.map(
              (p) => ['4XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http5xxCountSeries.map(
              (p) => ['5XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ),
          [
            { name: 'Code', type: 'dimension'},
            { name: 'Timestamp', type: 'dimension', subtype: 'temporal'},
            { name: 'Value',     type: 'measure'},
          ]
        ))
        .height(height)
        .config({
          axes: {
            x: {
              showAxisName: false,
            },
            y: {
              showAxisName: false,
              tickFormat: val => `${val}`,
            },
          }
        })
        .rows(['Value'])
        .columns(['Timestamp'])
        .color({field: 'Code', range: httpColorRange})
        .layers([{ mark: 'line' }])
        .mount('#http-responses-chart')
      ;
    }

    if (typeof response.series.httpAverageLatencySeries !== 'undefined') {
      env
        .canvas()
        .data(new muze.DataModel(
          [['Code', 'Timestamp','Value']].concat(
            response.series.http1xxLatencySeries.map(
              (p) => ['1XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http2xxLatencySeries.map(
              (p) => ['2XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http3xxLatencySeries.map(
              (p) => ['3XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http4xxLatencySeries.map(
              (p) => ['4XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ).concat(
            response.series.http5xxLatencySeries.map(
              (p) => ['5XX', p[0] * 1000, parseFloat(p[1])],
            ),
          ),
          [
            { name: 'Code', type: 'dimension'},
            { name: 'Timestamp', type: 'dimension', subtype: 'temporal'},
            { name: 'Value',     type: 'measure'},
          ]
        ))
        .height(height)
        .config({
          axes: {
            x: {
              showAxisName: false,
            },
            y: {
              showAxisName: false,
              tickFormat: val => `${val} ms`,
            },
          }
        })
        .rows(['Value'])
        .columns(['Timestamp'])
        .color({field: 'Code', range: httpColorRange})
        .layers([{ mark: 'line' }])
        .mount('#latency-chart')
      ;
    }

    var percentageValTickFormatter = (val) => {
      return `${val}%`;
    };

    var megabytesValTickFormatter = (val) => {
      var valInMB = val / (1024 * 1024);
      return `${valInMB.toFixed(1)} MB`;
    };

    if (typeof response.series.cpuSeries !== 'undefined') {
      [
        {
          selector: '#cpu-chart',
          series: response.series.cpuSeries,
          tickFormat: percentageValTickFormatter,
        },
        {
          selector: '#memory-chart',
          series: response.series.memorySeries,
          tickFormat: percentageValTickFormatter,
        },
        {
          selector: '#disk-chart',
          series: response.series.diskSeries,
          tickFormat: percentageValTickFormatter,
        },
        {
          selector: '#free-storage-space-chart',
          series: response.series.freeStorageSpaceSeries,
          tickFormat: megabytesValTickFormatter,
        },
      ].forEach(function(simpleChart) {

        if (!document.querySelector(simpleChart.selector)) {
          return;
        }

        env
          .canvas()
          .data(new muze.DataModel(
            [['Timestamp','Value']].concat(
              simpleChart.series.map((p) => [p[0] * 1000, parseFloat(p[1])]),
            ),
            [
              { name: 'Timestamp', type: 'dimension', subtype: 'temporal'},
              { name: 'Value',     type: 'measure'},
            ]
          ))
          .height(height)
          .config({
            axes: {
              x: {
                showAxisName: false,
              },
              y: {
                showAxisName: false,
                tickFormat: simpleChart.tickFormat,
              },
            }
          })
          .color({range: [singleChartColor]})
          .rows(['Value'])
          .columns(['Timestamp'])
          .layers([{ mark: 'line' }])
          .mount(simpleChart.selector)
        ;
      });
    }

  }).catch(function(err) { console.log(err); });
})();
