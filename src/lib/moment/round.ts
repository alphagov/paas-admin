import moment from 'moment';

export default function roundDown(date: moment.Moment, duration: moment.Duration): moment.Moment {
  return moment(Math.floor(+date / +duration) * +duration);
}
