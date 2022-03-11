import type { PluginFunction } from '@graphql-codegen/plugin-helpers';

export type Domain = 'local' | 'service';

export type ServiceFileExt = '.graphql';

export type QueryImpl = 'local' | 'service';

export type GqlServicePluginConfig = {
  domain?: Domain;
  serviceFileExt?: ServiceFileExt;
  skipValidation?: boolean;
  queryImpl?: QueryImpl;
};

export type ServiceFileBuilder = PluginFunction<GqlServicePluginConfig>;

export type LocalContentBuilder = PluginFunction<GqlServicePluginConfig>;
