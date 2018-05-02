import jwt from 'jsonwebtoken';
import { test } from 'tap';

import { Token } from '.';

const tokenKeys: ReadonlyArray<string> = ['secret', 'old-secret'];
const time = Math.floor(Date.now() / 1000);

test('should throw error if unverifiable accessToken', async t => {
  const accessToken = jwt.sign({}, 'bad-secret');
  t.throws(() => {
    const token = new Token(accessToken, tokenKeys);
    t.notOk(token);
  }, /invalid signature/);
});

test('should throw error if signed token is a string', async t => {
  const accessToken = jwt.sign('not-an-object', tokenKeys[0]);
  t.throws(() => {
    const token = new Token(accessToken, tokenKeys);
    t.notOk(token);
  }, /could not verify the token as no object has been verified/);
});

test('should throw error if expiry is missing', async t => {
  const accessToken = jwt.sign({}, tokenKeys[0]);
  t.throws(() => {
    const token = new Token(accessToken, tokenKeys);
    t.notOk(token);
  }, /could not verify the token as no exp have been decoded/);
});

test('should throw error if scope is not an array', async t => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60)), scope: 'not-an-array'}, tokenKeys[0]);
  t.throws(() => {
    const token = new Token(accessToken, tokenKeys);
    t.notOk(token);
  }, /could not verify the token as no scope/);
});

test('should have expiry', async t => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60)), scope: []}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  t.ok(token.expiry);
  t.ok(typeof token.expiry === 'number');
});

test('should have scopes', async t => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  t.ok(token.scopes);
  t.ok(token.scopes[0] === 'read-write');
});

test('should have scopes', async t => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[0]);
  const token = new Token(accessToken, tokenKeys);
  t.ok(token.hasScope('read-write'));
});

test('should succeed when verifying with older key', async t => {
  const accessToken = jwt.sign({exp: (time + (24 * 60 * 60)), scope: ['read-write']}, tokenKeys[1]);
  const token = new Token(accessToken, tokenKeys);
  t.ok(token.expiry);
});
