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
    });
  }).catch(function(err) { console.log(err); });
})();
