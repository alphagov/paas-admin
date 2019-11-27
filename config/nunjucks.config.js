const fs = require('fs');
const jmespath = require('jmespath');
const showdown = require('showdown');
const moment = require('moment');

const longUnits = {
  KiB : 'kibibytes',
  MiB : 'mibibytes',
  GiB : 'gibibytes',
  TiB : 'tebibytes',
};

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

  env.addFilter('nicedatetime', (date) => {
    return moment(date).format('h:mma, D MMMM YYYY');
  });

  env.addFilter('dateTime', (date) => {
    return moment(date).format('YYYY-MM-DD[T]HH:mm');
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

  env.addFilter('bytestohuman', (bytes) => {
    const units = ['KiB', 'MiB', 'GiB', 'TiB'];
    const thresh = 1024;

    if(Math.abs(bytes) < thresh) {
      return `${bytes.toFixed(0)}<abbr title="bytes">B</abbr>`;
    }

    let u = -1;
    while(Math.abs(bytes) >= thresh && u < units.length - 1) {
        bytes /= thresh;
        ++u;
    }

    return `${bytes.toFixed(2)}<abbr title="${longUnits[units[u]]}">${units[u]}</abbr>`;
  });

  env.addFilter('percentage', (num, denom) => {
    const percentage = 100 * (num / denom)
    return `${percentage.toFixed(1)}%`
  });
}

module.exports = configure;
