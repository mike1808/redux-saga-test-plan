import { call } from 'redux-saga/effects';
import reportActualEffects from 'expectSaga/reportActualEffects';
import ArraySet from 'utils/ArraySet';
import identity from 'utils/identity';
import serializeEffect from 'shared/serializeEffect';

test('returns empty string with no values', () => {
  const store = new ArraySet();
  const result = reportActualEffects(store, '');

  expect(result).toBe('');
});

test('returns comparison string when values present', () => {
  const effects = [
    call(identity, 'foo'),
    call(identity, 'bar'),
    call(identity, 'baz'),
  ];

  const store = new ArraySet(effects);
  const result = reportActualEffects(store, 'CALL');

  expect(result).toMatch(`${serializeEffect(effects[0], 'CALL')}`);
  expect(result).toMatch(`${serializeEffect(effects[1], 'CALL')}`);
  expect(result).toMatch(`${serializeEffect(effects[2], 'CALL')}`);
});
