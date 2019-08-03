// @flow
export const errorRegex = /expected (\w+) effect( not)? to happen, but it( never)? did/i;

export function unreachableError() {
  throw new Error('Should not be reached');
}
