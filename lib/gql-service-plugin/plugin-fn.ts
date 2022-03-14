import { formatMessage } from './utils';
import { serviceFileBuilderMap } from './service-file-builder';
import { contentBuilder as localContentBuilder } from './local-content-builder';
import type { PluginFunction, Types } from '@graphql-codegen/plugin-helpers';
import type { GqlServiceRawPluginConfig } from './types';

const pluginFnLocal: PluginFunction<GqlServiceRawPluginConfig> = async (
  schema,
  documents,
  config,
  info,
) => {
  if (!config.queryImpl) {
    throw new Error(formatMessage('queryImpl is not provided'));
  }
  return localContentBuilder(schema, documents, config, info);
};

const pluginFnService: PluginFunction<GqlServiceRawPluginConfig> = async (
  schema,
  documents,
  config,
  info,
) => {
  if (!config.serviceFileExt) {
    throw new Error(formatMessage('serviceFileExt is not provided'));
  }
  return serviceFileBuilderMap[config.serviceFileExt](
    schema,
    documents,
    config,
    info,
  );
};

export const pluginFn: PluginFunction<GqlServiceRawPluginConfig> = async (
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
