import { parse } from './formulaGrammar.pegjs';

describe('Billing formula grammar', () => {
  it('should return a single number', () => {
    expect(parse('1')).toBe(1);
    expect(parse('0')).toBe(0);
    expect(parse('1337.1337')).toBeCloseTo(1337.1337, 4);
  });

  it('should add 1 + 1', () => {
    expect(parse('1 + 1')).toBe(2);
  });

  it('should add floating point numbers', () => {
    expect(parse('1.1 + 1.1')).toBeCloseTo(2.2);
    expect(parse('12345.6789 + 98765.4321')).toBeCloseTo(111111.111);
  });

  it('should give multiplication higher precedence than addition and subtraction', () => {
    expect(parse('2*3+4')).toBe(10);
    expect(parse('2+3*4')).toBe(14);
    expect(parse('2*3-4')).toBe(2);
    expect(parse('2-3*4')).toBe(-10);
  });

  it('should give division higher precedence than multiplication, addition and subtraction', () => {
    expect(parse('1/2*4')).toBe(2);
    expect(parse('4*1/2')).toBe(2);

    expect(parse('4-1/2')).toBe(3.5);
    expect(parse('1/2-1')).toBe(-0.5);

    expect(parse('4+1/2')).toBe(4.5);
    expect(parse('1/2+1')).toBe(1.5);
  });

  it('should give brackets higher precedence than multiplication', () => {
    expect(parse('2*(3+4)')).toBe(14);
    expect(parse('(2+3)*4')).toBe(20);
  });

  it('should give brackets higher precedence than division', () => {
    expect(parse('1/(2*4)')).toBeCloseTo(1 / 8);
    expect(parse('(4*1)/2')).toBe(2);
  });

  it('should round numbers up with `ceil`', () => {
    expect(parse('ceil(1.00001)')).toBe(2);
    expect(parse('ceil(5)')).toBe(5);
    expect(parse('ceil(5555555555.5)')).toBe(5555555556);
    expect(parse('ceil(0.9999999)')).toBe(1);
  });

  it('should handle heavily nested functions', () => {
    expect(parse('(((((((1 + 1) * 2) + 1) * 2) + 1) * 2) + 1) * 2')).toBe(46);
  });

  it('should parse all the billing formula in use as of 2019-08-29', () => {
    const formulae = [
      { formula: '0', expectedValue: 0 },
      { formula: 'ceil(20000/3600) * 3.385', expectedValue: 20.31 },
      { formula: '2 * ceil(20000/3600) * 0.18', expectedValue: 2.16 },
      {
        formula: '2 * 20000 * (2048/1024.0) * (0.01 / 3600)',
        expectedValue: 0.22222,
      },
      {
        formula: '(4096/1024) * ceil(20000/2678401) * 0.266',
        expectedValue: 1.064,
      },
      {
        formula: '(2 * 20000 * (2048/1024.0) * (0.01 / 3600)) * 0.40',
        expectedValue: 0.08888,
      },
      {
        formula: '((1936.57/(48*1024))/30/24) * 2048 * ceil(20000 / 3600)',
        expectedValue: 0.6724201389,
      },
    ];
    formulae.forEach(f =>
      expect(parse(f.formula)).toBeCloseTo(f.expectedValue, 4),
    );
  });

  it('should error if the formula is badly formed', () => {
    expect(() => parse('(1 + ()1 + 1)')).toThrow();
    expect(() => parse('(1 + 1))')).toThrow();
    expect(() => parse('((1 + 1)')).toThrow();
    expect(() => parse('i liek grammar')).toThrow();
  });
});
