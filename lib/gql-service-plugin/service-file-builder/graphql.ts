import { ServiceFileBuilder } from '../types';

// find the operation
// handle client-only directives, then modify, and normalize operation (print?)
// gen hash for normalized operation
// embed hash
// print operation with fragments

export const fileBuilder: ServiceFileBuilder = (
  schema,
  documents,
  config,
  info,
) => {
  return '# service file content';
};
