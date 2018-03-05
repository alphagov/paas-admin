import express from 'express';
import usersTemplate from './users.njk';

const app = express();

async function getUsers(client, organization) {
  const users = await client.usersInOrganization(organization);

  return Promise.all(users.map(user => {
    return new Promise(async resolve => {
      user.spaces = await client.spacesForUserInOrganization(user.metadata.guid, organization);
      resolve(user);
    });
  }));
}

app.get('/:organization', (req, res) => {
  getUsers(req.cf, req.params.organization)
    .then(users => {
      res.send(usersTemplate.render({users}));
    })
    .catch(req.log.error);
});

export default app;
