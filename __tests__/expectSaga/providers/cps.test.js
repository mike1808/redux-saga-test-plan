// @flow
import { cps, put } from 'redux-saga/effects';
import type { Saga } from 'redux-saga';

import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const handler = (cb): void => {
  cb(null, 1);
};
const otherHandler = (): number => 0;

function* saga(): Saga<void> {
  const value = yield cps(handler);
  const otherValue = yield cps(otherHandler, 21);

  yield put({ type: 'DONE', payload: value + otherValue });
}

test('uses provided value for `cps`', () =>
  expectSaga(saga)
    .provide({
      cps({ fn, args: [value] }, next) {
        if (fn === otherHandler) {
          return value * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[cps(otherHandler, 21), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.cps(otherHandler, 21), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses partial static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.cps.fn(otherHandler), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses dynamic values for static providers', () =>
  expectSaga(saga)
    .provide([[m.cps.fn(otherHandler), dynamic(() => 42)]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide([[m.cps.fn(otherHandler), dynamic(effect => effect.args[0] * 3)]])
    .put({ type: 'DONE', payload: 64 })
    .run());
