// @flow
import serializeEffect from '../shared/serializeEffect';

export default function reportActualEffects(
  store: Object,
  storeKey: string,
): string {
  const values = store.values();

  if (values.length === 0) {
    return '';
  }

  const serializedEffects = values.map(effect =>
    serializeEffect(effect, storeKey)
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n'),
  );

  return serializedEffects.join('\n\n');
}
