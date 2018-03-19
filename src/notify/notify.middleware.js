import NotifcationClient from './notify.client';

export default function notifyMiddleware({apiKey, templates}) {
  return (req, res, next) => {
    req.notify = new NotifcationClient({apiKey, templates});
    next();
  };
}
