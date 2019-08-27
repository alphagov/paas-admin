export function wrapResources(...resources: ReadonlyArray<any>) {
  return {
    total_pages: 1,
    total_results: resources.length,

    resources,

    prev_url: null,
    next_url: null,
  };
}
