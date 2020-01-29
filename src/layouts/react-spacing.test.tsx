import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function spacesMissingAroundInlineElements(
  body: string,
): ReadonlyArray<string> {
  /* eslint-disable no-useless-escape */
  const regexTextBeforeElement = /[0-9a-zA-Z\.\,\?\!\:\)]+\<[0-9a-zA-Z]+.+?\>/g;
  const regexTextAfterElement = /\<\/[0-9a-zA-Z]+\>[0-9a-zA-Z\(\[]+/g;
  /* eslint-enable no-useless-escape */

  const missingSpacesBefore = body.match(regexTextBeforeElement) || [];
  const missingSpacesAfter = body.match(regexTextAfterElement) || [];

  return [...missingSpacesBefore, ...missingSpacesAfter];
}

describe(spacesMissingAroundInlineElements, () => {
  it('correctly checks whether any spaces are missing before or after elements', () => {
    expect(
      spacesMissingAroundInlineElements(renderToStaticMarkup(<p>Text.</p>)),
    ).toHaveLength(0);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text <a href="#">Link</a> Text
          </p>,
        ),
      ),
    ).toHaveLength(0);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <>
            <h1>Header</h1>
            <p>Text</p>
          </>,
        ),
      ),
    ).toHaveLength(0);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text<a href="#">Link</a>.
          </p>,
        ),
      ),
    ).toHaveLength(1);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text<a href="#">Link</a> Text
          </p>,
        ),
      ),
    ).toHaveLength(1);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text<a href="#">Link</a>Text
          </p>,
        ),
      ),
    ).toHaveLength(2);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text<span>Link</span>Text
          </p>,
        ),
      ),
    ).toHaveLength(2);
    expect(
      spacesMissingAroundInlineElements(
        renderToStaticMarkup(
          <p>
            Text
            <a href="#">Link</a>
            Text
          </p>,
        ),
      ),
    ).toHaveLength(2);
  });
});
