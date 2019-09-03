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

  es.addEventListener('error', function () { console.log('error'); es.close(); });
  es.addEventListener('message', function (e) {
    var data = JSON.parse(e.data);

    data.batch.forEach(function (item) {
      console.log(item);

      var timestamp = new Date(item.timestamp / 1e6).toISOString();
      var log = atob(item.log.payload);

      try {
        // Attempt to pretty print JSON
        var parsedLog = JSON.parse(log);
        log = JSON.stringify(parsedLog, null, 2);
      } catch (e) {
        console.info('Could not parse log as JSON, appending normally', e);
      }

      var rowElem = document.createElement('div');
      rowElem.className = 'log-line';

      var logGutterElem = document.createElement('span');
      logGutterElem.className = 'log-gutter';
      logGutterElem.append(document.createTextNode(timestamp));

      var logBodyElem = document.createElement('span');
      logBodyElem.className = 'log-body';
      logBodyElem.append(document.createTextNode(log));

      rowElem.append(logGutterElem);
      rowElem.append(logBodyElem);

      var scrollOffset = document.body.scrollHeight -
                         window.innerHeight -
                         window.scrollY;

      var shouldScroll = scrollOffset <= 250; // arbitrarily close to bottom

      elem.append(rowElem);

      if (shouldScroll) {
        window.scrollTo(
          0, document.body.scrollHeight - window.innerHeight - 200
        );
      }
    });
  });

})();
