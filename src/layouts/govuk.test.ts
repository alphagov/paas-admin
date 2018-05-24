import { test } from 'tap';
import govukTemplate from './govuk.njk';

test('it should render ok without any special parameters', async t => {
  const html = govukTemplate.render({});
  t.contains(html, 'Platform as a Service');
});
