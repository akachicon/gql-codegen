import { Kind, visit } from 'graphql';
import { formatMessageFactory } from './formatting';

const PACKAGE_NAME = 'validate-single-operation';
const formatMessage = formatMessageFactory(PACKAGE_NAME);

import type { ASTVisitor } from 'graphql';
import type { Types } from '@graphql-codegen/plugin-helpers';

export function validateSingleOperation(document: Types.DocumentFile): {
  isValid: boolean;
  hasOperation: boolean;
} {
  if (!document.document) {
    throw new Error(
      formatMessage(
        'undefined document cannot be validated:\n' +
          `\tlocation=${document.location}\n` +
          `\tSDL=${document.rawSDL}`,
      ),
    );
  }
  let operationCount = 0;
  const visitor: ASTVisitor = {
    [Kind.OPERATION_DEFINITION]: {
      enter() {
        operationCount += 1;

        // Skip subtree to improve performance.
        return false;
      },
    },
  };
  visit(document.document, visitor);

  return {
    isValid: operationCount <= 1,
    hasOperation: operationCount >= 1,
  };
}
