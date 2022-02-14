import { pluginFn } from './plugin-fn';
import { pluginValidateFn } from './plugin-validate-fn';
import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import type { GqlServicePluginConfig } from './types';

export { PACKAGE_NAME } from './constants';

export const plugin: CodegenPlugin<GqlServicePluginConfig>['plugin'] = pluginFn;

export const validate: CodegenPlugin<GqlServicePluginConfig>['validate'] =
  pluginValidateFn;
