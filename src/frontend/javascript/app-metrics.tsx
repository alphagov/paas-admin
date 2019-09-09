import React from 'react'; // This has to be imported despite not being used
import { hydrate } from 'react-dom'

import { AppMetricsComponent } from '../../components/metrics';

const parseDates = (_, v) => {
  // This function can be used as a 2nd arg to JSON.parse
  // And it will automagically turn datestrings into Date objects

  const dateFmt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.]\d+Z)?$/;

  if (typeof v === 'string' && dateFmt.test(v)) {
    return new Date(v);
  }

  return v;
};

console.info('about to hydrate app metrics component');

const rawAppmetricsComponentProps = atob(
  document.querySelector('#app-metrics-component-props').innerHTML,
);
console.info({rawAppmetricsComponentProps});

const appMetricsComponentProps = JSON.parse(
  rawAppmetricsComponentProps,
  parseDates,
);
console.info({appMetricsComponentProps});

hydrate(
  <AppMetricsComponent {...appMetricsComponentProps} />,
  document.querySelector('#app-metrics-component-root'),
);

console.log('hydrated app metrics component');
