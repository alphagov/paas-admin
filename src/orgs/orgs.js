import express from 'express';
import orgs from './orgs.njk';

const app = express();

app.get('/', (req, res) => {
  req.cf.organizations()
    .then(organizations => {
      res.send(orgs.render({organizations}));
    })
    .catch(req.log.error);
});

export default app;
