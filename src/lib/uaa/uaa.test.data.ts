export const usersByEmail = `{
  "resources" : [ {
    "emails" : [ {
      "value" : "imeCkO@test.org",
      "primary" : false
    } ],
    "active" : true,
    "id" : "99022be6-feb8-4f78-96f3-7d11f4d476f1",
    "userName" : "imeCkO@test.org"
  } ],
  "startIndex" : 1,
  "itemsPerPage" : 50,
  "totalResults" : 1,
  "schemas" : [ "urn:scim:schemas:core:1.0" ]
}`;

export const user = `{
  "id" : "47ea627c-45b4-4b2b-ab76-3683068fdc89",
  "externalId" : "test-user",
  "meta" : {
    "version" : 0,
    "created" : "2018-05-22T23:45:25.621Z",
    "lastModified" : "2018-05-22T23:45:25.621Z"
  },
  "userName" : "zGLifk@test.org",
  "name" : {
    "familyName" : "family name",
    "givenName" : "given name"
  },
  "emails" : [ {
    "value" : "zGLifk@test.org",
    "primary" : false
  } ],
  "groups" : [ {
    "value" : "6e4ee08e-1318-44cf-b4cb-9c88a983aefc",
    "display" : "profile",
    "type" : "DIRECT"
  }, {
    "value" : "589f428b-7375-4be7-b805-8ecfa2911692",
    "display" : "user_attributes",
    "type" : "DIRECT"
  }, {
    "value" : "a8478fb8-46e6-473a-b788-53223f77fcd8",
    "display" : "password.write",
    "type" : "DIRECT"
  }, {
    "value" : "01d6be0c-2bbd-46a2-b46d-cef08fdc4ca8",
    "display" : "scim.me",
    "type" : "DIRECT"
  }, {
    "value" : "d49949c7-be6e-4008-be38-b6ec76d82ce8",
    "display" : "openid",
    "type" : "DIRECT"
  }, {
    "value" : "0d89798f-7327-4e9b-ace1-95751def91d6",
    "display" : "scim.userids",
    "type" : "DIRECT"
  }, {
    "value" : "8737f07c-3365-44dd-8d1c-8efd535a4b79",
    "display" : "cloud_controller.read",
    "type" : "DIRECT"
  }, {
    "value" : "93c713d2-6f88-4faf-9ab4-c2e992bbae31",
    "display" : "cloud_controller.write",
    "type" : "DIRECT"
  }, {
    "value" : "07723467-2fbd-4d76-8bf1-3e14449a2f45",
    "display" : "approvals.me",
    "type" : "DIRECT"
  }, {
    "value" : "6253cc94-fec4-4951-8467-00c8fb26abcc",
    "display" : "cloud_controller_service_permissions.read",
    "type" : "DIRECT"
  }, {
    "value" : "3bc97cf0-125a-41b1-8ff5-35b221fa4732",
    "display" : "oauth.approvals",
    "type" : "DIRECT"
  }, {
    "value" : "f96bdc88-b553-419b-9801-41427b4ec489",
    "display" : "uaa.offline_token",
    "type" : "DIRECT"
  }, {
    "value" : "44daaaa0-0df4-4d87-b230-cda36f148490",
    "display" : "uaa.user",
    "type" : "DIRECT"
  }, {
    "value" : "fc742b38-3446-4a9f-8267-1293f8d06261",
    "display" : "roles",
    "type" : "DIRECT"
  } ],
  "approvals" : [ {
    "userId" : "47ea627c-45b4-4b2b-ab76-3683068fdc89",
    "clientId" : "client id",
    "scope" : "scim.read",
    "status" : "APPROVED",
    "lastUpdatedAt" : "2018-05-22T23:45:25.643Z",
    "expiresAt" : "2018-05-22T23:45:35.643Z"
  }, {
    "userId" : "47ea627c-45b4-4b2b-ab76-3683068fdc89",
    "clientId" : "identity",
    "scope" : "uaa.user",
    "status" : "APPROVED",
    "lastUpdatedAt" : "2018-05-22T23:45:55.650Z",
    "expiresAt" : "2018-05-22T23:45:55.650Z"
  } ],
  "phoneNumbers" : [ {
    "value" : "5555555555"
  } ],
  "active" : true,
  "verified" : true,
  "origin" : "uaa",
  "zoneId" : "uaa",
  "passwordLastModified" : "2018-05-22T23:45:25.000Z",
  "previousLogonTime" : 1527032725655,
  "lastLogonTime" : 1527032725657,
  "schemas" : [ "urn:scim:schemas:core:1.0" ]
}`;

export const noFoundUsersByEmail = `{
  "resources" : [],
  "startIndex" : 0,
  "itemsPerPage" : 50,
  "totalResults" : 0,
  "schemas" : [ "urn:scim:schemas:core:1.0" ]
}`;

export const invite = `{
    "new_invites" : [
      {
        "email" : "user1@71xl2o.com",
        "userId" : "5ff19d4c-8fa0-4d74-94e0-52eac86d55a8",
        "origin" : "uaa",
        "success" : true,
        "errorCode" : null,
        "errorMessage" : null,
        "inviteLink" : "http://localhost/invitations/accept?code=TWQlsE3gU2"
      }
    ],
    "failed_invites" : [ ]
}`;
