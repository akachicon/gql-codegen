import path from 'path';
import { Types } from '@graphql-codegen/plugin-helpers';
import { PACKAGE_NAME } from './constants';
import { formatMessageFactory } from '../utils';

export const formatMessage = formatMessageFactory(PACKAGE_NAME);

export function getPluginName(plugin: Types.ConfiguredPlugin) {
  return Object.keys(plugin)[0];
}

export function changeExtension(file: string, extension: string) {
  const basename = path.basename(file, path.extname(file));
  return path.join(path.dirname(file), basename + extension);
}
