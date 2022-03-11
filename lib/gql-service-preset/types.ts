import type { NearOperationFileConfig } from '@graphql-codegen/near-operation-file-preset';
import type { ServiceFileExt, QueryImpl } from '../gql-service-plugin/types';

// TODO: .d.ts files with correct optional props
type GqlServicePresetConfigBase = {
  queryImpl?: QueryImpl;
  serviceDir?: string;
  serviceFileExt?: ServiceFileExt;
};

export type GqlServicePresetConfig = GqlServicePresetConfigBase &
  Omit<NearOperationFileConfig, keyof GqlServicePresetConfigBase>;
