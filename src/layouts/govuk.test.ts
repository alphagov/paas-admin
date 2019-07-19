import govukTemplate from './govuk.njk';

describe('layout test suite', () => {
  it('it should render a location tag', async () => {
    const html = govukTemplate.render({
      context: {
        location: 'Taggy McTaggington',
        csrf: '',
      },
    });
    expect(html).toContain('Taggy McTaggington');
  });
});
