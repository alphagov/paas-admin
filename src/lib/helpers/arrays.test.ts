import { groupByAndMap } from './arrays';

describe('groupByAndMap', () => {
  it('should map the empty list to the empty object', () => {
    const result = groupByAndMap([], x => x, x => x);
    expect(result).toEqual({});
  });

  it('should group and map objects', () => {
    const scores = [
      {name: 'amy'     , score: 99},
      {name: 'muhammed', score: 99},
      {name: 'biff'    , score: 58},
      {name: 'boyce'   , score: 12},
    ];
    const result = groupByAndMap(
      scores,
      x => x.score > 80 ? 'A' : x.score > 50 ? 'B' : 'FAIL',
      x => x.name,
    );
    expect(result).toEqual({A: ['amy', 'muhammed'], B: ['biff'], FAIL: ['boyce']});
  });
});
