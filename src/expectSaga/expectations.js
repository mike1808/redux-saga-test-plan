// @flow
import isMatch from 'lodash.ismatch';
import isEqual from 'lodash.isequal';
import inspect from '../utils/inspect';
import type ArraySet from '../utils/ArraySet';
import serializeEffect from '../shared/serializeEffect';
import reportActualEffects from './reportActualEffects';

type ExpectationThunkArgs = {|
  storeState: mixed,
  returnValue: mixed,
  errorValue: mixed,
|};

export type Expectation = ExpectationThunkArgs => void;

type EffectExpectationArgs = {|
  effectName: string,
  expectedEffect: mixed,
  storeKey: string,
  like: boolean,
  extractEffect: Function,
  store: ArraySet<mixed>,
  expected: boolean,
|};

const matchers = {
  toEffectHappen(matcher, actual: ExpectationThunkArgs) {
    return matcher.call(this, actual);
  },
  toSagaReturns(matcher, actual: ExpectationThunkArgs) {
    return matcher.call(this, actual);
  },
  toHaveStoreState(matcher, actual: ExpectationThunkArgs) {
    return matcher.call(this, actual);
  },
  toSagaThrow(matcher, actual: ExpectationThunkArgs) {
    return matcher.call(this, actual);
  },
};

expect.extend(matchers);

export function createEffectExpectation({
  effectName,
  expectedEffect,
  storeKey,
  like,
  extractEffect,
  store,
  expected,
}: EffectExpectationArgs): Expectation {
  function matcher() {
    const deleted = like
      ? store.deleteBy(item => isMatch(extractEffect(item), expectedEffect))
      : store.delete(expectedEffect);

    const serializedEffect = like
      ? `like ${inspect(expectedEffect)}`
      : serializeEffect(expectedEffect, storeKey);

    if (deleted && !expected) {
      return {
        pass: false,
        message: () =>
          `Expected ${effectName} effect not to happen, but it did.` +
          `\n\n${this.utils.RECEIVED_COLOR(`Received: ${serializedEffect}`)}`,
      };
    }

    if (!deleted && expected) {
      const serializedActual = reportActualEffects(store, storeKey);
      return {
        actual: store.values(),
        expected: like ? { payload: expectedEffect } : expectedEffect,
        pass: false,
        message: () =>
          `${`Expected ${effectName} effect to happen, but it never did.` +
            `\n`}${
            serializedActual
              ? `\n${this.utils.EXPECTED_COLOR(
                  `Actual effects: \n\n${reportActualEffects(store, storeKey)}`,
                )}\n`
              : ''
          }\n${this.utils.RECEIVED_COLOR(`Received: ${serializedEffect}`)}`,
      };
    }

    return { pass: true, message: () => '' };
  }

  return (arg: ExpectationThunkArgs) => {
    // $FlowFixMe
    expect(matcher).toEffectHappen(arg);
  };
}

type ReturnExpectationArgs = {
  value: mixed,
  expected: boolean,
};

export function createReturnExpectation({
  value,
  expected,
}: ReturnExpectationArgs): Expectation {
  function matcher({ returnValue }: ExpectationThunkArgs) {
    if (expected && !isEqual(value, returnValue)) {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR(
            'Expected the saga to return given value.',
          )}` +
          `\n\n${this.utils.diff(value, returnValue, {
            expand: this.exand,
          })}`,
        actual: returnValue,
        expected: value,
      };
    }

    if (!expected && isEqual(value, returnValue)) {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR(
            'Expected the saga not to return given value.',
          )}` +
          `\n\nBut it returned the exact value:` +
          `\n  ${this.utils.printReceived(returnValue)}`,
        actual: returnValue,
        expected: value,
      };
    }

    return { pass: true, message: () => '' };
  }

  return (arg: ExpectationThunkArgs) => {
    // $FlowFixMe
    expect(matcher).toSagaReturns(arg);
  };
}

type StoreStateExpectationArgs = {
  state: mixed,
  expected: boolean,
};

export function createStoreStateExpectation({
  state: expectedState,
  expected,
}: StoreStateExpectationArgs): Expectation {
  function matcher({ storeState }: ExpectationThunkArgs) {
    if (expected && !isEqual(expectedState, storeState)) {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR(
            'Expected saga to have final store state.',
          )}` +
          `\n\n${this.utils.diff(expectedState, storeState, {
            expand: this.expand,
          })}`,
        actual: storeState,
        expected: expectedState,
      };
    }
    if (!expected && isEqual(expectedState, storeState)) {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR(
            'Expected saga not to have final store state.',
          )}` +
          `\n\nBut it has the exact value:` +
          `\n  ${this.utils.printReceived(expectedState)}`,
        actual: expectedState,
        expected: expectedState,
      };
    }

    return { pass: true, message: () => '' };
  }

  return (arg: ExpectationThunkArgs) => {
    // $FlowFixMe
    expect(matcher).toHaveStoreState(arg);
  };
}

type ErrorExpectationArgs = {
  type: mixed,
  expected: boolean,
};

export function createErrorExpectation({
  type,
  expected,
}: ErrorExpectationArgs): Expectation {
  function matcher({ errorValue }: ExpectationThunkArgs) {
    let serializedExpected = typeof type;

    if (typeof type === 'object') {
      serializedExpected = inspect(type);
    } else if (typeof type === 'function') {
      serializedExpected = type.name;
    }

    const matches = () =>
      (typeof type === 'object' && isEqual(type, errorValue)) ||
      (typeof type === 'function' && errorValue instanceof type);

    if (!expected) {
      if (typeof errorValue === 'undefined' || !matches())
        return { pass: true };

      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR('Expected saga not to throw.')}` +
          `\n\nBut it has thrown:` +
          `\n  ${this.utils.printReceived(serializedExpected)}`,
      };
    }

    if (typeof errorValue === 'undefined') {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR('Expected saga to throw.')}` +
          `\n\nExpected to throw:` +
          `\n  ${this.utils.printReceived(serializedExpected)}` +
          `\nBut no error has thrown.`,
      };
    }

    if (typeof type === 'object' && !matches()) {
      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR('Expected saga to throw.')}` +
          `\n\n${this.utils.diff(type, errorValue, {
            expand: this.expand,
          })}`,
        expected: type,
        actual: errorValue,
      };
    }

    if (typeof type === 'function' && !matches()) {
      const serializedActual =
        errorValue != null && typeof errorValue.constructor === 'function'
          ? errorValue.constructor.name
          : typeof errorValue;

      return {
        pass: false,
        message: () =>
          `${this.utils.DIM_COLOR('Expected saga to throw error of type.')}` +
          `\n\nExpected to throw: ${this.utils.printExpected(
            serializedActual,
          )}` +
          `\nBut instead threw: ${this.utils.printReceived(
            serializedExpected,
          )}`,
      };
    }

    return {
      pass: true,
    };
  }

  return (args: ExpectationThunkArgs) => {
    // $FlowFixMe
    expect(matcher).toSagaThrow(args);
  };
}
