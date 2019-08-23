export function wrapResourcesV3(...resources: ReadonlyArray<any>) {
  return {
    pagination: {
      total_results: resources.length,
      total_pages: 1,

      first: 'https://127.0.0.1/cf/wrap-resources-v3',
      last: 'https://127.0.0.1/cf/wrap-resources-v3',

      next: null,
      previous: null,
    },

    resources,
  };
}
