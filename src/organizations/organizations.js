import express from 'express';
import organizationsTemplate from './organizations.njk';

const app = express();

app.get('/', (req, res) => {
  req.cf.organizations()
    .then(organizations => {
      res.send(organizationsTemplate.render({organizations}));
    })
    .catch(req.log.error);
});

export default app;
