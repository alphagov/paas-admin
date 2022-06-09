/**
 * @jest-environment jsdom
 */
 import { render } from '@testing-library/react';
import {
    appInstanceDescription,
    appInstanceDescriptionText,
} from './views';

describe(appInstanceDescription, () => {
  it('should display "1 app instance with 64 MiB of memory" wihout a decimal point', () => {
    const { container } = render(appInstanceDescription(64,1))
    expect(container).toHaveTextContent("1 app instance with 64 MiB of memory");
  });

  it('should display "1 app instance with 1.5 GiB of memory" with a decimal point', () => {
    const { container } = render(appInstanceDescription(1536,1));
    expect(container).toHaveTextContent("1 app instance with 1.5 GiB of memory");
  });

  it('should display "1 app instance with 2 GiB of memory" without a decimal point', () => {
    const { container } = render(appInstanceDescription(2048,1));
    expect(container).toHaveTextContent("1 app instance with 2 GiB of memory");
  });
});

describe(appInstanceDescriptionText, () => {
  it('should return text "1 app instance with 64 mebibytes of memory', () => {
    const text = appInstanceDescriptionText(64,1);
    expect(text).toContain("1 app instance with 64 mebibytes of memory");
  });
  it('should return text "1 app instance with 1.5 gibibytes of memory', () => {
    const text = appInstanceDescriptionText(1536,1);
    expect(text).toContain("1 app instance with 1.5 gibibytes of memory");
  });
});
