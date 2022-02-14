type Domain = 'local' | 'service';

export type GqlServicePluginConfig = {
  domain?: Domain;
  skipValidation?: boolean;
};
