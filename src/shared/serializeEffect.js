// @flow

import { effectTypes } from 'redux-saga/effects';
import type {
  Effect,
  PutEffect,
  CallEffect,
  TakeEffect,
  RaceEffect,
  CpsEffect,
  ForkEffect,
  SelectEffect,
  ActionChannelEffect,
  GetContextEffect,
  SetContextEffect,
  AllEffect,
} from 'redux-saga';
import inspect from '../utils/inspect';

export default function serializeEffect(
  effect: mixed,
  effectKey?: ?string,
  arraySeparator?: string = '\n',
): string {
  // TODO: fix types for effect
  // eslint-disable-next-line no-unused-expressions
  ((effect: any): Effect | $ReadOnlyArray<Effect> | { +[string]: Effect });

  if (
    effect != null &&
    typeof effect === 'object' &&
    !Array.isArray(effect) &&
    effectKey &&
    effectKey in effect
  ) {
    // $FlowFixMe effect is a storage
    return serializeEffect(effect[effectKey], effectKey);
  }

  if (Array.isArray(effect)) {
    return effect.map(ef => serializeEffect(ef)).join(arraySeparator);
  }

  const { type } = effect;

  switch (type) {
    case effectTypes.PUT:
      return serializePutEffect(((effect: any): PutEffect<*, *, *>));
    case effectTypes.CALL:
      return serializeCallEffect(((effect: any): CallEffect<*, *, *>));
    case effectTypes.TAKE:
      return serializeTakeEffect(((effect: any): TakeEffect<*, *, *>));
    case effectTypes.RACE:
      return serializeRaceEffect(((effect: any): RaceEffect<*>));
    case effectTypes.CPS:
      return serializeCpsEffect(((effect: any): CpsEffect<*, *, *>));
    case effectTypes.FORK:
      return serializeForkEffect(((effect: any): ForkEffect<*, *, *, *>));
    case effectTypes.SELECT:
      return serializeSelectEffect(((effect: any): SelectEffect<*, *>));
    case effectTypes.ACTION_CHANNEL:
      return serializeActionChannelEffect(
        ((effect: any): ActionChannelEffect<*, *, *>),
      );
    case effectTypes.GET_CONTEXT:
      return serializeGetContextEffect(((effect: any): GetContextEffect<*>));
    case effectTypes.SET_CONTEXT:
      return serializeSetContextEffect(((effect: any): SetContextEffect<*>));
    case effectTypes.ALL:
      return serializeAllEffect(((effect: any): AllEffect));
    // case effectTypes.CANCELLED:
    //   return serializeCancelledEffect(effect);
    // case effectTypes.FLUSH:
    //   return serializeFlushEffect(effect);
    // case effectTypes.CANCEL:
    //   return serializeCancelEffect(effect);
    // case effectTypes.JOIN:
    //   return serializeJoinEffect(effect);
    default:
      return inspect(effect);
  }
}

function serializePutEffect(effect: PutEffect<*, *, *>) {
  const { payload: { channel, action, resolve } } = effect;

  const effectKey = resolve ? 'putResolve' : 'put';

  const effectArgs = [channel, action].filter(Boolean).map(inspect);

  return `${effectKey}(${effectArgs.join(', ')})`;
}

function serializeCallEffect(
  effect: CallEffect<*, *, *> | CpsEffect<*, *, *> | ForkEffect<*, *, *, *>,
  effectKey: string = 'call',
) {
  const { payload: { context, fn, args } } = effect;

  const effectArgs = [];

  if (context) {
    effectArgs.push(inspect({ context, fn }));
  } else if (fn) {
    effectArgs.push(inspect(fn));
  }

  effectArgs.push(...args.map(inspect));

  return `${effectKey}(${effectArgs.join(', ')})`;
}

function serializeTakeEffect(effect: TakeEffect<*, *, *>) {
  const { payload } = effect;
  const effectKey = payload.maybe ? 'takeMaybe' : 'take';

  let effectArg = '';

  if ('pattern' in payload) {
    effectArg = inspect(payload.pattern);
  } else if ('channel' in payload) {
    effectArg = 'channel';
  }

  return `${effectKey}(${effectArg})`;
}

function serializeCombinatorEffect(
  effect: RaceEffect<*> | AllEffect,
  effectKey: string,
) {
  const { payload: effects } = effect;

  let effectArg = '';

  // TODO change serialization to more generic
  if (Array.isArray(effects)) {
    effectArg = `[${serializeEffect(effects, ', ')}]`;
  } else {
    const initialBracket = '{';
    const endingBracket = '}';
    effectArg = Object.keys(effects).reduce(
      (res, ef) => `${res}  ${ef}: ${serializeEffect(effects[ef])},\n`,
      '',
    );

    effectArg = `${initialBracket}\n${effectArg}${endingBracket}`;
  }

  return `${effectKey}(${effectArg})`;
}

function serializeRaceEffect(effect: RaceEffect<*>) {
  return serializeCombinatorEffect(effect, 'race');
}

function serializeAllEffect(effect: AllEffect) {
  return serializeCombinatorEffect(effect, 'all');
}

function serializeCpsEffect(effect: CpsEffect<*, *, *>) {
  return serializeCallEffect(effect, 'cps');
}

function serializeForkEffect(effect: ForkEffect<*, *, *, *>) {
  const { payload: { detached } } = effect;

  return serializeCallEffect(effect, detached ? 'spawn' : 'fork');
}

function serializeSelectEffect(effect: SelectEffect<*, *>) {
  const { payload: { selector, args } } = effect;

  const effectArgs = [selector, ...args].map(inspect);

  return `select(${effectArgs.join(', ')})`;
}

function serializeActionChannelEffect(effect: ActionChannelEffect<*, *, *>) {
  const { payload: { pattern, buffer } } = effect;

  const effectArgs = [pattern, buffer].filter(Boolean).map(inspect);

  return `actionChannel(${effectArgs.join(', ')})`;
}

function serializeGetContextEffect(effect: GetContextEffect<*>) {
  const { payload: prop } = effect;

  return `getContext(${inspect(prop)})`;
}

function serializeSetContextEffect(effect: SetContextEffect<*>) {
  const { payload: props } = effect;

  return `setContext(${inspect(props)})`;
}
