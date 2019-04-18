import express from 'express';

function mockBilling(app: express.Application, _config: { stubApiPort: string, adminPort: string }) {
  app.get('/billable_events', (_req, res) => {
    res.send(JSON.stringify([]));
  });
};

export default mockBilling;
