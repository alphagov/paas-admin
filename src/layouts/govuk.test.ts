import govukTemplate from './govuk.njk';

describe('layout test suite', () => {
  it('it should render ok without any special parameters', async () => {
    const html = govukTemplate.render({});
    expect(html).toContain('Platform as a Service');
  });
});
