import React from 'react';
import GoogleCityMap, {
  GoogleCityMapProps,
} from './GoogleCityMap';

export type CityMapProps = GoogleCityMapProps;

export const CityMap: React.FC<CityMapProps> = (props) => {
  return <GoogleCityMap {...props} />;
};

export default CityMap;