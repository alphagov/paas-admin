import express from 'express';
import spacesTemplate from './spaces.njk';

const app = express();

app.get('/:organization', (req, res) => {
  req.cf.spaces(req.params.organization)
    .then(spaces => {
      res.send(spacesTemplate.render({spaces}));
    })
    .catch(req.log.error);
});

export default app;
