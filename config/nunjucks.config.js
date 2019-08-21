const jmespath = require('jmespath');
const showdown = require('showdown');
const moment = require('moment-timezone');

const differenceInMinutes = require('date-fns/differenceInMinutes')
const differenceInHours = require('date-fns/differenceInHours')
const differenceInDays = require('date-fns/differenceInDays')

const datetimeLocalFmt = 'YYYY-MM-DDTHH:mm';
const timezone = 'Europe/London';

function configure(env) {
  env.addFilter('query', (data, query) => {
    return jmespath.search(data, query);
  });

  // Usage:
  // original = [{firstName: "jeff", lastName: "jefferson"}]
  // {{ original | map({fullName: "join(' ', [firstName, lastName])"}) }}
  // output => [{fullName: "jeff jefferson"}]
  env.addFilter('map', (data, queryObject) => {
    const mapping = Object.keys(queryObject)
      .map(k => `${k}: ${queryObject[k]}`)
      .join(',');
    const query = `[].{${mapping}}`;
    try {
      return jmespath.search(data, query);
    } catch (err) {
      /* istanbul ignore next */
      throw new Error(`error applying 'map' filter with query "${query}": ${err.message}`);
    }
  });

  env.addFilter('currency', (n, precision) => {
    return parseFloat(n,10).toFixed(precision);
  });

  env.addFilter('markdown', (text) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
  });

  env.addFilter('plural', (n, singular, plural) => {
    if (n === 1) {
      return singular;
    }
    return plural;
  });

  env.addFilter('nicedate', (date) => {
    return moment(date).format('MMMM Do YYYY');
  });

  env.addFilter('nicetime', (date) => {
    return moment(date).format('HH:mm');
  });

  env.addFilter('nicetimeseconds', (date) => {
    return moment(date).format('HH:mm:ss');
  });

  env.addFilter('nicetimedelta', (historicTime, instantTime) => {
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const earlier = moment.tz(historicTime, datetimeLocalFmt, timezone).toDate();
    const later = moment.tz(instantTime, datetimeLocalFmt, timezone).toDate();

    const diffMillis = moment(later).diff(earlier);

    if (diffMillis < oneHour) {
      return differenceInMinutes(later, earlier);
    } else if (diffMillis < oneDay) {
      return differenceInHours(later, earlier);
    } else {
      return differenceInDays(later, earlier);
    }
  });

  env.addFilter('timedeltaunits', (historicTime, instantTime) => {
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const earlier = moment.tz(historicTime, datetimeLocalFmt, timezone).toDate();
    const later = moment.tz(instantTime, datetimeLocalFmt, timezone).toDate();

    const diffMillis = moment(later).diff(earlier);

    if (diffMillis < oneHour) {
      const minutes = differenceInMinutes(later, earlier);
      return minutes.toFixed(0) === '1' ? 'minute' : 'minutes';
    } else if (diffMillis < oneDay) {
      const hours = differenceInHours(later, earlier);
      return hours.toFixed(0) === '1' ? 'hour' : 'hours';
    } else {
      const days = differenceInDays(later, earlier);
      return days.toFixed(0) === '1' ? 'day' : 'days';
    }
  });

  env.addFilter('relativetime', (date) => {
    return moment(date).fromNow();
  });

  env.addFilter('pastorfuture', (date, past, future) => {
    if (new Date() > date) {
      return past
    }
    return future
  });

  env.addFilter('linkify', (links) => {
    return links.map(link => {
      if (link.match(/apps[.]internal/)) {
        return link
      }

      let protocolOrEmpty = link.match(/^https?:/) ? '' : 'https://';

      return `<a href="${protocolOrEmpty}${link}" class="govuk-link">${link}</a>`;
    });
  });

  env.addFilter('mibtogib', (mib) => {
    return `${(mib / 1024).toFixed(2)}<abbr title="gibibytes">GiB</abbr>`;
  });

  env.addFilter('percentage', (num, denom) => {
    const percentage = 100 * (num / denom)
    return `${percentage.toFixed(1)}%`
  });
}

module.exports = configure;
