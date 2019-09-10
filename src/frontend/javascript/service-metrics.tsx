import React from 'react'; // This has to be imported despite not being used
import { hydrate } from 'react-dom'

import { ServiceMetricsComponent } from '../../components/metrics';

const parseDates = (_, v) => {
  // This function can be used as a 2nd arg to JSON.parse
  // And it will automagically turn datestrings into Date objects

  const dateFmt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.]\d+Z)?$/;

  if (typeof v === 'string' && dateFmt.test(v)) {
    return new Date(v);
  }

  return v;
};

console.info('about to hydrate service metrics component');

const rawServicemetricsComponentProps = atob(
  document.querySelector('#service-metrics-component-props').innerHTML,
);
console.info({rawServicemetricsComponentProps});

const serviceMetricsComponentProps = JSON.parse(
  rawServicemetricsComponentProps,
  parseDates,
);
console.info({serviceMetricsComponentProps});

hydrate(
  <ServiceMetricsComponent {...serviceMetricsComponentProps} />,
  document.querySelector('#service-metrics-component-root'),
);

console.log('hydrated service metrics component');
