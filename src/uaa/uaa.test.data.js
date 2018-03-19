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
