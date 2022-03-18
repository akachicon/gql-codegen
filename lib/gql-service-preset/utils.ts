import { basename, dirname, extname, join } from 'path';
import { PACKAGE_NAME } from './constants';
import { formatMessageFactory } from '../utils';
import type { Types } from '@graphql-codegen/plugin-helpers';

export const formatMessage = formatMessageFactory(PACKAGE_NAME);

export function getPluginName(plugin: Types.ConfiguredPlugin) {
  return Object.keys(plugin)[0];
}

export function changeExtension(file: string, extension: string) {
  const fileBasename = basename(file, extname(file));
  return join(dirname(file), fileBasename + extension);
}
