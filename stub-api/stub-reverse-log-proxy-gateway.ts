import express from 'express';
import moment from 'moment';

import {IStubServerPorts} from './index';

const interval = 1000;

  // tslint:disable:max-line-length
const rtrLogPayload = `stub.paas-admin.local - [2019-08-09T16:03:31.934+0000] GET /foo/bar/baz HTTP/1.1 304 0 0 https://stub.paas-admin.local Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36 127.0.0.1:45038 10.0.32.4:61002 x_forwarded_for:99.99.99.99, 127.0.0.1 x_forwarded_proto:https vcap_request_id:00000000-1111-2222-3333-444444444444 response_time:0.020198976 app_id:00000000-1111-2222-3333-444444444444 app_index:0 x_b3_traceid:760deb0d6124a017 x_b3_spanid:760deb0d6124a017 x_b3_parentspanid:- b3:760deb0d6124a017-760deb0d6124a017`;
const appLogPayload = `{"message": "I am a log line", "metadata": "I am some metadata"}`;
  // tslint:enable:max-line-length

function writeLog(res: any) {
  // tslint:disable:max-line-length
  res.write(
    `data: {"batch":[{"timestamp":"${moment().toDate().getTime() / 1000}","source_id":"00000000-1111-2222-3333-444444444444","instance_id":"1","deprecated_tags":{},"tags":{"__v1_type":"LogMessage","deployment":"stub","index":"00000000-1111-2222-3333-444444444444","ip":"10.0.49.101","job":"router","origin":"gorouter","source_type":"RTR"},"log":{"payload":"${Buffer.from(rtrLogPayload).toString('base64')}","type":"OUT"}}]}`,
  );
  res.write('\n\n');
  res.write(
    `data: {"batch":[{"timestamp":"${moment().toDate().getTime() / 1000}","source_id":"00000000-1111-2222-3333-444444444444","instance_id":"1","deprecated_tags":{},"tags":{"__v1_type":"LogMessage","deployment":"stub","index":"00000000-1111-2222-3333-444444444444","ip":"10.0.49.101","job":"router","origin":"diego","source_type":"APP"},"log":{"payload":"${Buffer.from(appLogPayload).toString('base64')}","type":"OUT"}}]}`,
  );
  res.write('\n\n');
  // tslint:enable:max-line-length
  setTimeout(() => writeLog(res), interval);
}

function mockReverseLogProxyGateway(
  app: express.Application,
  _config: IStubServerPorts,
): express.Application {

  app.get(
    /v2.read/,
    (_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write('\n\n');

      writeLog(res);
    },
  );

  return app;
}

export default mockReverseLogProxyGateway;
