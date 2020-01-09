import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server'; // tslint:disable-line:no-submodule-imports

export function testSpacing(body: string): ReadonlyArray<string> {
  const regexTextBeforeElement = /[0-9a-zA-Z\.\,\?\!\:\)]+\<[0-9a-zA-Z]+.+?\>/g;
  const regexTextAfterElement = /\<\/[0-9a-zA-Z]\>[0-9a-zA-Z\(\[]+/g;

  const missingSpacesBefore = body.match(regexTextBeforeElement) || [];
  const missingSpacesAfter = body.match(regexTextAfterElement) || [];

  return [...missingSpacesBefore, ...missingSpacesAfter];
}

describe(testSpacing, () => {
  it('correctly checks whether any spaces are missing before or after elements', () => {
    expect(testSpacing(renderToStaticMarkup(<p>Text.</p>))).toHaveLength(0);
    expect(testSpacing(renderToStaticMarkup(<p>Text <a href="#">Link</a> Text</p>))).toHaveLength(0);
    expect(testSpacing(renderToStaticMarkup(<><h1>Header</h1><p>Text</p></>))).toHaveLength(0);
    expect(testSpacing(renderToStaticMarkup(<p>Text<a href="#">Link</a>.</p>))).toHaveLength(1);
    expect(testSpacing(renderToStaticMarkup(<p>Text<a href="#">Link</a> Text</p>))).toHaveLength(1);
    expect(testSpacing(renderToStaticMarkup(<p>Text<a href="#">Link</a>Text</p>))).toHaveLength(2);
    expect(testSpacing(renderToStaticMarkup(<p>
      Text
      <a href="#">
        Link
      </a>
      Text
    </p>))).toHaveLength(2);
  });
});
