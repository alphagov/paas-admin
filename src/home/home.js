import express from 'express';
import home from './home.njk';

const app = express();

app.get('/', (req, res) => {
  res.send(home.render());
});

export default app;
