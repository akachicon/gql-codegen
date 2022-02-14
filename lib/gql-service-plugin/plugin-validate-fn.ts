import { validateSingleOperation } from '../utils';
import { formatMessage } from './utils';
import type { PluginValidateFn } from '@graphql-codegen/plugin-helpers';
import type { GqlServicePluginConfig } from './types';

export const pluginValidateFn: PluginValidateFn<
  GqlServicePluginConfig
> = async (schema, documents, config): Promise<void> => {
  // Preset can use this hint to skip validation if the documents were
  // validated.
  if (config.skipValidation) {
    return;
  }
  documents.forEach((document) => {
    const { isValid } = validateSingleOperation(document);
    if (!isValid) {
      throw new Error(
        formatMessage(
          `More than one operation definition found in file ${document.location}`,
        ),
      );
    }
  });
};
