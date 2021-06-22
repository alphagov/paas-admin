import { Duration, milliseconds } from 'date-fns';

export default function roundDown(date: Date, duration: Duration): Date {
  return new Date(Math.floor(+date / +milliseconds(duration)) * +milliseconds(duration));
}
