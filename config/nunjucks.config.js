import jmespath from 'jmespath';

export default function configure(env) {
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
  })
}
