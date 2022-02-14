import { PlanetListQuery } from './__generated__/planet-list.query';

declare const planetList: PlanetListQuery;

planetList?.allPlanets?.edges?.forEach((edge) => {
  console.log(edge?.node?.id, edge?.node?.name);
});
