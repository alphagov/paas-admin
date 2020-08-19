import { render} from 'enzyme';
import {
    appInstanceDescription,
    appInstanceDescriptionText,
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

describe(appInstanceDescriptionText, () => {
  it('should return text "1 app instance with 64 mebibytes of memory', () => {
    const instanceDescription = appInstanceDescriptionText(64,1).toString()
    expect(instanceDescription).toEqual("1 app instance with 64 mebibytes of memory")
  });
  it('should return text "1 app instance with 1.5 gibibytes of memory', () => {
    const instanceDescription = appInstanceDescriptionText(1536,1).toString()
    expect(instanceDescription).toEqual("1 app instance with 1.5 gibibytes of memory")
  });
});