export type Domain = 'local' | 'service';

export type QueryImpl = 'local' | 'service';

export type GqlServicePluginConfig = {
  domain?: Domain;
  skipValidation?: boolean;
  queryImpl?: QueryImpl;
};
