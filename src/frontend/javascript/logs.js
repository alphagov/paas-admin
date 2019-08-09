(function () {
  'use strict';

  if (typeof window.EventSource !== 'function') { return; }

  var elem = document.getElementById('js-application-logs');
  if (!elem) { return; }

  var pathnameAppGuidRegex = /applications\/([^\/]+)/;
  var matches = pathnameAppGuidRegex.exec(location.pathname);
  if (matches.length < 2) { return; }

  var appGUID = matches[1];

  var es = new EventSource(
    '/stream-logs/' + appGUID,
    { withCredentials: true }
  );

  es.onmessage = function (e) {
    var data = JSON.parse(e.data);
    var logs = data.batch.map(function(item) {
      return atob(item.log.payload)
    });
    logs.forEach(function (log) {
      elem.innerText += log + "\n";
    })
  }

})();