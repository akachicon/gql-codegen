import type { Types } from '@graphql-codegen/plugin-helpers';

export function validateSingleOperation(document: Types.DocumentFile): {
  isValid: boolean;
  hasOperation: boolean;
} {
  return {
    isValid: true,
    hasOperation: true,
  };
}
