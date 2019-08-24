import { IRouteV3 } from '../types';

export const spaceGUID = 'bc8d3381-390d-4bd7-8c71-25309900a2e3';
export const domainGUID = '0b5f3633-194c-42d2-9408-972366617e0e';
export const routeGUID = '15b3885d-0351-4b9b-8697-86641668c123';
export const routeHost = 'a-hostname';
export const routePath = '/some_path';
export const routeURL = 'a-hostname.a-domain.com/some_path';

export const route = (): IRouteV3 => JSON.parse(`{
  "guid": "${routeGUID}",
  "host": "${routeHost}",
  "path": "${routePath}",
  "url": "${routeURL}",
  "created_at": "2019-05-10T17:17:48Z",
  "updated_at": "2019-05-10T17:17:48Z",
  "metadata": {
    "labels": { },
    "annotations": { }
  },
  "relationships": {
    "space": {
      "data": {
        "guid": "${spaceGUID}"
      }
    },
    "domain": {
      "data": {
        "guid": "${domainGUID}"
      }
    }
  },
  "links": {
    "self": {
      "href": "https://api.example.org/v3/routes/${routeGUID}"
    },
    "space": {
      "href": "https://api.example.org/v3/spaces/${spaceGUID}"
    },
    "domain": {
      "href": "https://api.example.org/v3/domains/${domainGUID}"
    },
    "destinations": {
      "href": "https://api.example.org/v3/routes/${routeGUID}/destinations"
    }
  }
}`);
