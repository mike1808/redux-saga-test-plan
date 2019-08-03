// @flow
import { apply, put } from 'redux-saga/effects';
import type { Saga } from 'redux-saga';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const context = {
  apiFunction: () => 0,
};

const otherContext = {
  otherApiFunction: () => 1,
};

function* saga(): Saga<void> {
  const value = yield apply(context, context.apiFunction, [21]);
  const otherValue = yield apply(otherContext, otherContext.otherApiFunction);
  yield put({ type: 'DONE', payload: value + otherValue });
}

test('uses provided value for `apply` via `call`', () =>
  expectSaga(saga)
    .provide({
      call({ fn, context: ctx, args: [arg] }, next) {
        if (ctx === context && fn === context.apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[apply(context, context.apiFunction, [21]), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.apply(context, context.apiFunction, [21]), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses partial static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.apply.fn(context.apiFunction), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses dynamic values for static providers', () =>
  expectSaga(saga)
    .provide([[m.apply.fn(context.apiFunction), dynamic(() => 42)]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide([
      [m.apply.fn(context.apiFunction), dynamic(effect => effect.args[0] * 3)],
    ])
    .put({ type: 'DONE', payload: 64 })
    .run());
