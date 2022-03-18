import type { RawConfig } from '@graphql-codegen/visitor-plugin-common';
import type { PluginFunction } from '@graphql-codegen/plugin-helpers';

export type Domain = 'local' | 'service';

export type ServiceFileExt = '.graphql';

export type QueryImpl = 'direct' | 'service';

export type GqlServicePluginConfigBase = {
  filename?: string;
  domain?: Domain;
  serviceFileExt?: ServiceFileExt;
  skipValidation?: boolean;
  queryImpl?: QueryImpl;
};

export type GqlServicePluginConfig = Omit<
  RawConfig,
  keyof GqlServicePluginConfigBase
> &
  GqlServicePluginConfigBase;

export type ServiceFileBuilder = PluginFunction<GqlServicePluginConfig>;

export type LocalContentBuilder = PluginFunction<GqlServicePluginConfig>;
