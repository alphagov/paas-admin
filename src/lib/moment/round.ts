import moment, { Duration, Moment } from 'moment';

export default function roundDown(date: Moment, duration: Duration) {
  return moment(Math.floor((+date) / (+duration)) * (+duration));
}
