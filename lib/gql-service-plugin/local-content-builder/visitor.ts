import { ClientSideBaseVisitor } from '@graphql-codegen/visitor-plugin-common';
import autoBind from 'auto-bind';
import type { GraphQLSchema } from 'graphql';
import type { Types } from '@graphql-codegen/plugin-helpers';
import type {
  ClientSideBasePluginConfig,
  LoadedFragment,
} from '@graphql-codegen/visitor-plugin-common';
import type { GqlServiceRawPluginConfig } from '../types';

export type GqlServicePluginConfigBase = {
  //
};

// Represents internal config structure of the plugin.
export type GqlServicePluginConfig = Omit<
  ClientSideBasePluginConfig,
  keyof GqlServicePluginConfigBase
> &
  GqlServicePluginConfigBase;

export class QueryImplVisitor extends ClientSideBaseVisitor<
  GqlServiceRawPluginConfig,
  GqlServicePluginConfig
> {
  constructor(
    schema: GraphQLSchema,
    fragments: LoadedFragment[],
    config: GqlServiceRawPluginConfig,
    documents: Types.DocumentFile[],
  ) {
    super(schema, fragments, config, {});
    autoBind(this);
  }

  extractFragments(...args: any[]): string[] {
    // @ts-ignore
    return this._extractFragments(...args);
  }

  transformFragments(...args: any[]): any {
    // @ts-ignore
    return this._transformFragments(...args);
  }

  generateFragment(...args: any[]): any {
    // @ts-ignore
    return this._generateFragment(...args);
  }

  get allFragments() {
    return this._fragments;
  }
}
