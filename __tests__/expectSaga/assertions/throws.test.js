/* eslint-disable require-yield */
import { put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

class CustomError {}

function* noErrorSaga() {
  yield put({ type: 'TEST_1' });
  yield put({ type: 'TEST_2' });
}

function* errorSaga(errorToThrow) {
  throw errorToThrow;
}

test('matches based on error type', () =>
  expectSaga(errorSaga, new CustomError('Error Message'))
    .throws(CustomError)
    .run());

test('matches based on error value', () => {
  const customErrorInstance = new CustomError();

  return expectSaga(errorSaga, customErrorInstance)
    .throws(customErrorInstance)
    .run();
});

test('matches plain error object by value', () =>
  expectSaga(errorSaga, { message: 'foo' })
    .throws({ message: 'foo' })
    .run());

test('fails when no error thrown', done =>
  expectSaga(noErrorSaga)
    .put({ type: 'TEST_1' })
    .put({ type: 'TEST_2' })
    .throws(CustomError)
    .run()
    .catch(e => {
      expect(e.message).toMatch(/but no error has thrown/i);
      done();
    }));

test('fails when non-matching error type thrown', done =>
  expectSaga(errorSaga, new Error())
    .throws(CustomError)
    .run()
    .catch(e => {
      expect(e.message).toMatch(/but instead threw/i);
      done();
    }));

test('fails when non-matching error value thrown', done =>
  expectSaga(errorSaga, { message: 'Error 1' })
    .throws({ message: 'Error 2' })
    .run()
    .catch(e => {
      expect(e.message).toMatch(/Expected/i);
      expect(e.message).toMatch(/Received/i);
      done();
    }));

test('checks other expectations when matching error thrown', done =>
  expectSaga(errorSaga, new CustomError())
    .put({ type: 'TEST_3' })
    .throws(CustomError)
    .run()
    .catch(e => {
      expect(e.message).toMatch(
        /Expected put effect to happen, but it never did/i,
      );
      done();
    }));

test('negative assertion passes when no error thrown', () =>
  expectSaga(noErrorSaga)
    .not.throws(CustomError)
    .run());

test('negative assertion fails when matching error thrown', done =>
  expectSaga(errorSaga, new CustomError())
    .not.throws(CustomError)
    .run()
    .catch(e => {
      expect(e.message).toMatch(/expected saga not to throw/i);
      done();
    }));

test('exception bubbles up when no error expected', done => {
  const errorValue = new Error();

  return expectSaga(errorSaga, errorValue)
    .run()
    .catch(e => {
      expect(e).toBe(errorValue);
      done();
    });
});
