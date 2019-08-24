import { IRouteDestinationsV3 } from '../types';

import { appGUID } from './app';
import { routeGUID } from './route-v3';

export const destinationGUID = '89323d4e-2e84-43e7-83e9-adbf50a20c0e';

export const routeDestinations = (): IRouteDestinationsV3 => {
  const response: IRouteDestinationsV3 = JSON.parse(`{
    "destinations": [
      {
        "guid": "${destinationGUID}",
        "app": {
          "guid": "${appGUID}",
          "process": {
            "type": "web"
          }
        },
        "weight": null,
        "port": 8080
      }
    ],
    "links": {
      "self": {
        "href": "https://api.example.org/v3/routes/${routeGUID}/destinations"
      },
      "route": {
        "href": "https://api.example.org/v3/routes/${routeGUID}"
      }
    }
  }`);

  return response;
};
