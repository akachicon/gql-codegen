import { NearOperationFileConfig } from '@graphql-codegen/near-operation-file-preset';

// TODO: .d.ts files with correct optional props
type GqlServicePresetConfigBase = {
  serviceDir?: string;
};

export type GqlServicePresetConfig = GqlServicePresetConfigBase &
  Omit<NearOperationFileConfig, keyof GqlServicePresetConfigBase>;
