import express from 'express';
import applicationsTemplate from './applications.njk';

const app = express();

app.get('/:space', (req, res) => {
  req.cf.applications(req.params.space)
    .then(applications => {
      res.send(applicationsTemplate.render({applications}));
    })
    .catch(req.log.error);
});

export default app;
