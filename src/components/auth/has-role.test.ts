import jwt from 'jsonwebtoken';

import { Token } from '.';

const tokenKeys: ReadonlyArray<string> = ['secret', 'old-secret'];
const time = Math.floor(Date.now() / 1000);

it('should throw error if unverifiable accessToken', async () => {
  const accessToken = jwt.sign({}, 'bad-secret');
  expect(() => {
    const token = new Token(accessToken, tokenKeys);
    expect(token).not.toBeTruthy();
  }).toThrow(/invalid signature/);
});

it('should throw error if signed token is a string', async () => {
  const accessToken = jwt.sign('not-an-object', tokenKeys[0]);
  expect(() => {
    const token = new Token(accessToken, tokenKeys);
    expect(token).not.toBeTruthy();
  }).toThrow(/could not verify the token as no object has been verified/);
});

it('should throw error if expiry is missing', async () => {
  const accessToken = jwt.sign({origin: 'uaa'}, tokenKeys[0]);
  expect(() => {
    const token = new Token(accessToken, tokenKeys);
    expect(token).not.toBeTruthy();
  }).toThrow(/could not verify the token as no exp has been decoded/);
});

it('should throw error if origin is missing', async () => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60))}, tokenKeys[0]);
  expect(() => {
    const token = new Token(accessToken, tokenKeys);
    expect(token).not.toBeTruthy();
  }).toThrow(/could not verify the token as no origin has been decoded/);
});

it('should throw error if scope is not an array', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: 'not-an-array'}, tokenKeys[0]);
  expect(() => {
    const token = new Token(accessToken, tokenKeys);
    expect(token).not.toBeTruthy();
  }).toThrow(/could not verify the token as no scope/);
});

it('should have expiry', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: []}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  expect(token.expiry).toBeDefined();
  expect(typeof token.expiry).toEqual('number');
});

it('should have scopes', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  expect(token.scopes).toBeDefined();
  expect(token.scopes[0]).toEqual('read-write');
});

it('should have scopes', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  expect(token.hasScope('read-write')).toBeTruthy();
});

it('should have scopes', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: ['read-write', 'write-read']}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  expect(token.hasAnyScope('write-read')).toBeTruthy();
  expect(token.hasAnyScope('admin')).toBeFalsy();
});

it('should succeed when verifying with older key', async () => {
  const accessToken = jwt.sign({origin: 'uaa', exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[1]);
  const token = new Token(accessToken, tokenKeys);
  expect(token.expiry).toBeDefined();
});
