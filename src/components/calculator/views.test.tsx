import { render } from 'enzyme';
import {
    appInstanceDescription,
} from './views';

describe(appInstanceDescription, () => {
  it('should display "1 app instance with 64 MiB of memory" wihout a decimal point', () => {
    const instanceDescription = render(appInstanceDescription(64,1)).text()
    expect(instanceDescription).toEqual("1 app instance with 64 MiB of memory")
  });

  it('should display "1 app instance with 1.5 GiB of memory" with a decimal point', () => {
    const instanceDescription = render(appInstanceDescription(1536,1)).text()
    expect(instanceDescription).toEqual("1 app instance with 1.5 GiB of memory")
  });

  it('should display "1 app instance with 2 GiB of memory" without a decimal point', () => {
    const instanceDescription = render(appInstanceDescription(2048,1)).text()
    expect(instanceDescription).toEqual("1 app instance with 2 GiB of memory")
  });
});
