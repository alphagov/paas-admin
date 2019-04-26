import govukTemplate from './govuk.njk';

describe('layout test suite', () => {
  it('it should render a location tag', async () => {
    const html = govukTemplate.render({location: 'Taggy McTaggington'});
    expect(html).toContain('Taggy McTaggington');
  });
});
