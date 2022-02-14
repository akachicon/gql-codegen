import { formatMessage } from './utils';
import type { PluginFunction, Types } from '@graphql-codegen/plugin-helpers';
import type { GqlServicePluginConfig } from './types';

const pluginFnLocal: PluginFunction<GqlServicePluginConfig> = async (
  schema,
  documents,
) => {
  return {
    content: '',
  };
};

const pluginFnService: PluginFunction<GqlServicePluginConfig> = async (
  schema,
  documents,
) => {
  return {
    content: '',
  };
};

export const pluginFn: PluginFunction<GqlServicePluginConfig> = async (
  schema,
  documents,
  config,
): Promise<Types.PluginOutput> => {
  const domain = config.domain;
  if (domain === 'local') {
    return pluginFnLocal(schema, documents, config);
  }
  if (domain === 'service') {
    return pluginFnService(schema, documents, config);
  }
  return {
    content: '',
  };
};
