window.disableMetricsFilterButton = function () {
  document.querySelector('#filter-metrics').disabled = true;
  return true;
};

(function() {
  var percentageValTickFormatter = (val) => {
    return `${val}%`;
  };

  var megabytesValTickFormatter = (val) => {
    var valInMB = val / (1024 * 1024);
    return `${valInMB.toFixed(1)} MB`;
  };

  var dataPath = window.location.pathname + '.json';

  var historicTime = new Date(document.querySelector('#start-time').value);
  var instantTime = new Date(document.querySelector('#end-time').value);

  var env = muze();
  var DataModel = muze.DataModel;
  var html = muze.Operators.html;
  var DateTimeFormatter = muze.utils.DateTimeFormatter;
  var height = 200;

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

  fetch(dataPath).then(function(response) {
    console.info(response);
    return response.json();
  }).then(function(metrics) {
    console.info(metrics);

    return Promise.all(
      metrics.map(function(metricName) {
        var dataPath = window.location.pathname + '/' + metricName + '.json'
        dataPath += '?start-time=' + historicTime.getTime().toString();
        dataPath += '&end-time=' + instantTime.getTime().toString();

        return fetch(dataPath).then(function(response) {
          console.info(response);
          return response.json();
        }).then(function(metric) {
          console.info(metricName, metric);
          return {key: metricName, val: metric};
        });
      })
    );
  }).then(function(metrics) {
    metrics.forEach(function(m) {
      console.log(m);
      if (m.key === 'app-http-reliability-aggregated-singlestat') {
        document
          .querySelector('#http-reliability-value')
          .innerText = parseFloat(m.val).toFixed(1);
      }

      if (m.key === 'app-http-latency-aggregated-singlestat') {
        document
          .querySelector('#latency-value')
          .innerText = parseFloat(m.val).toFixed(1);
      }

      if (m.key === 'rds-free-storage-space-aggregated-singlestat') {
        document
          .querySelector('#free-storage-space-value')
          .innerText = parseFloat(m.val/ (1024 * 1024)).toFixed(1);
      }

      console.info(m);

      if (m.key === 'app-http-count-aggregated-series') {
        env
          .canvas()
          .data(new muze.DataModel(
            [['Code', 'Timestamp','Value']].concat(
              m.val.map(
                (p) => ['Total', p[0] * 1000, parseFloat(p[1])],
              ),
            ),
            [
              { name: 'Code', type: 'dimension'},
              { name: 'Timestamp', type: 'dimension', subtype: 'temporal', format: '%Y-%m-%d %H:%M'},
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

      if (m.key === 'app-http-latency-aggregated-series') {
        env
          .canvas()
          .data(new muze.DataModel(
            [['Code', 'Timestamp','Value']].concat(
              m.val.map(
                (p) => ['Total', p[0] * 1000, parseFloat(p[1])],
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

      var selector;
      var tickFormat;

      if (m.key === 'app-cpu-usage-aggregated-series') {
        selector = '#cpu-chart';
        tickFormat = percentageValTickFormatter;
      }

      if (m.key === 'app-memory-usage-aggregated-series') {
        selector = '#memory-chart';
        tickFormat = percentageValTickFormatter;
      }

      if (m.key === 'app-disk-usage-aggregated-series') {
        selector = '#disk-chart';
        tickFormat = percentageValTickFormatter;
      }

      if (m.key === 'rds-free-storage-space-aggregated-series') {
        selector = '#free-storage-space-chart';
        tickFormat = megabytesValTickFormatter;
      }

      if (m.key === 'rds-cpu-usage-aggregated-series') {
        selector = '#cpu-chart';
        tickFormat = megabytesValTickFormatter;
      }

      if (!document.querySelector(selector)) {
        return;
      }

      env
        .canvas()
        .data(new muze.DataModel(
          [['Timestamp','Value']].concat(
            m.val.map((p) => [p[0] * 1000, parseFloat(p[1])]),
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
              tickFormat: tickFormat,
            },
          }
        })
        .color({range: [singleChartColor]})
        .rows(['Value'])
        .columns(['Timestamp'])
        .layers([{ mark: 'line' }])
        .mount(selector)
      ;
    });

  }).catch(function(err) { console.log(err); });
})();
