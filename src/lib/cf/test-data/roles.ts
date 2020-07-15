import { IRole } from '../types';

export function orgRole(
  roleType: string,
  orgGUID: string,
  userGUID: string,
): IRole {
  return JSON.parse(`{
   "type": "${roleType}",

   "relationships": {
      "user": {
         "data": {
            "guid": "${userGUID}"
         }
      },
      "organization": {
         "data": {
            "guid": "${orgGUID}"
         }
      },
      "space": {
         "data": null
      }
   }
}`);
}

export function spaceRole(
  roleType: string,
  orgGUID: string,
  spaceGUID: string,
  userGUID: string,
): IRole {
  return JSON.parse(`{
   "type": "${roleType}",

   "relationships": {
      "user": {
         "data": {
            "guid": "${userGUID}"
         }
      },
      "organization": {
         "data": {
            "guid": "${orgGUID}"
         }
      },
      "space": {
         "data": {
            "guid": "${spaceGUID}"
         }
      }
   }
}`);
}
