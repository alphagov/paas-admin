import { IV3Response } from '../types';

export function wrapResources(...resources: ReadonlyArray<any>) {
  return {
    total_pages: 1,
    total_results: resources.length,

    resources,

    prev_url: null,
    next_url: null,
  };
}

export function wrapV3Resources(...resources: ReadonlyArray<any>): IV3Response<any> {
  return {
    pagination: {
      total_pages: 1,
      total_results: resources.length,
      first: { href: '/not-implemented' },
      last: { href: '/not-implemented' },
    },
    resources,
  };
}
