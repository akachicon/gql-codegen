import type { LocalContentBuilder } from '../types';

// find the operation
// handle client-only directives and normalize operation (print?)
// gen hash for normalized operation
// generate and embed response validation schema
// generate and embed query impl with hash

export const contentBuilder: LocalContentBuilder = (
  schema,
  documents,
  config,
  info,
) => {
  return '// local content';
};
