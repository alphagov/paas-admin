import express from 'express';
import servicesTemplate from './services.njk';

const app = express();

app.get('/:space', (req, res) => {
  req.cf.services(req.params.space)
    .then(services => {
      res.send(servicesTemplate.render({services}));
    })
    .catch(req.log.error);
});

export default app;
