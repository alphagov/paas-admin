import express from 'express';
import orgs from './orgs.njk';

const app = express();

app.get('/', (req, res) => {
  res.send(orgs.render({name: req.query.name}));
});

export default app;
