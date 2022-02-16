import { Types } from '@graphql-codegen/plugin-helpers';
import { PACKAGE_NAME } from './constants';
import { formatMessageFactory } from '../utils';

export const formatMessage = formatMessageFactory(PACKAGE_NAME);

export function getPluginName(plugin: Types.ConfiguredPlugin) {
  return Object.keys(plugin)[0];
}
