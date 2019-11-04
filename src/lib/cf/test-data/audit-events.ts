import { IAuditEvent } from '../types';

export const eventGUID = 'a595fe2f-01ff-4965-a50c-290258ab8582';

export const actorGUID = 'd144abe3-3d7b-40d4-b63f-2584798d3ee5';
export const actorName = 'admin';

export const targetGUID = '2e3151ba-9a63-4345-9c5b-6d8c238f4e55';
export const targetName = 'my-app';

export const spaceGUID = 'cb97dd25-d4f7-4185-9e6f-ad6e585c207c';
export const orgGUID = 'd9be96f5-ea8f-4549-923f-bec882e32e3c';

export const auditEvent = (): IAuditEvent => JSON.parse(`{
  "guid": "${eventGUID}",
  "created_at": "2016-06-08T16:41:23Z",
  "updated_at": "2016-06-08T16:41:26Z",
  "type": "audit.app.update",
  "actor": {
    "guid": "${actorGUID}",
    "type": "user",
    "name": "${actorName}"
  },
  "target": {
    "guid": "${targetGUID}",
    "type": "app",
    "name": "${targetName}"
  },
  "data": {
    "request": {
      "recursive": true
    }
  },
  "space": {
    "guid": "${spaceGUID}"
  },
  "organization": {
    "guid": "${orgGUID}"
  },
  "links": {
    "self": {
      "href": "https://api.example.org//v3/audit_events/${eventGUID}"
    }
  }
}`);
