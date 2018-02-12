import http from 'http';

export default class Server {

  constructor(handler, opts = {}) {
    this.handler = handler;
    if (!this.handler) {
      throw new Error(`you must supply a handler`);
    }
    this.port = opts.port || 0;
  }

  async start() {
    if (this.http) {
      throw new Error('cannot start server: server is already started');
    }
    this.http = http.createServer(this.handler);
    this.http.listen(this.port);
    return new Promise((resolve, reject) => {
      this.http.once('listening', () => resolve(this));
      this.http.once('error', reject);
    });
  }

  async stop() {
    if (!this.http) {
      throw new Error('cannot stop server: server is not started');
    }
    const wait = this.wait();
    const http = this.http;
    this.http = null;
    http.close();
    return wait;
  }

  async wait() {
    if (!this.http) {
      throw new Error('cannot wait on server: server is not started');
    }
    return new Promise((resolve, reject) => {
      this.http.once('close', resolve);
      this.http.once('error', reject);
    });
  }

  update(handler) {
    const oldHandler = this.handler;
    this.handler = handler;
    if (!this.http) {
      return;
    }
    this.http.removeListener('request', oldHandler);
    this.http.on('request', this.handler);
  }

}

