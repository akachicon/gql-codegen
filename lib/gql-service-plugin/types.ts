import type { RawClientSideBasePluginConfig } from '@graphql-codegen/visitor-plugin-common';
import type { PluginFunction } from '@graphql-codegen/plugin-helpers';

export type Domain = 'local' | 'service';

export type ServiceFileExt = '.graphql';

export type QueryImpl = 'local' | 'service';

export type GqlServicePluginConfigBase = {
  domain?: Domain;
  serviceFileExt?: ServiceFileExt;
  skipValidation?: boolean;
  queryImpl?: QueryImpl;
};

// TODO: review after finishing implementation
export type GqlServiceRawPluginConfig = Omit<
  RawClientSideBasePluginConfig,
  | keyof GqlServicePluginConfigBase
  | 'documentMode'
  | 'noGraphQLTag'
  | 'gqlImport'
  | 'documentNodeImport'
  | 'noExport'
  | 'importOperationTypesFrom'
  | 'importDocumentNodeExternallyFrom'
  | 'useTypeImports'
> &
  GqlServicePluginConfigBase;

export type ServiceFileBuilder = PluginFunction<GqlServiceRawPluginConfig>;

export type LocalContentBuilder = PluginFunction<GqlServiceRawPluginConfig>;
