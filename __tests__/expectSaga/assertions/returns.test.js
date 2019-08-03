/* eslint-disable require-yield */
import { call, fork, spawn } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { delay } from 'utils/async';
import { unreachableError } from './_helper';

function* saga() {
  return { foo: 'bar' };
}

test('asserts return value', () =>
  expectSaga(saga)
    .returns({ foo: 'bar' })
    .run());

test('negative call assertion passes', () =>
  expectSaga(saga)
    .not.returns({ hello: 'world' })
    .run());

test('call assertion fails', () =>
  expectSaga(saga)
    .returns({ hello: 'world' })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(/expected the saga to return/i);
    }));

test('negative call assertion fails', () =>
  expectSaga(saga)
    .not.returns({ foo: 'bar' })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(/expected the saga not to return/i);
    }));

test('called sagas do not affect return value', () => {
  function* otherSaga() {
    return { hello: 'world' };
  }

  function* localSaga() {
    yield call(otherSaga);
    return { foo: 'bar' };
  }

  return expectSaga(localSaga)
    .returns({ foo: 'bar' })
    .run();
});

test('forked sagas do not affect return value', () => {
  function* otherSaga() {
    yield call(delay, 200);
    return { hello: 'world' };
  }

  function* localSaga() {
    yield fork(otherSaga);
    return { foo: 'bar' };
  }

  return expectSaga(localSaga)
    .returns({ foo: 'bar' })
    .run(false);
});

test('spawned sagas do not affect return value', () => {
  function* otherSaga() {
    yield call(delay, 200);
    return { hello: 'world' };
  }

  function* localSaga() {
    yield spawn(otherSaga);
    return { foo: 'bar' };
  }

  return expectSaga(localSaga)
    .returns({ foo: 'bar' })
    .run(false);
});
