import { fileBuilder as graphQLFileBuilder } from './graphql';
import type { ServiceFileExt, ServiceFileBuilder } from '../types';

type ServiceFileBuilderMap = Record<ServiceFileExt, ServiceFileBuilder>;

export const serviceFileBuilderMap: ServiceFileBuilderMap = {
  '.graphql': graphQLFileBuilder,
};
