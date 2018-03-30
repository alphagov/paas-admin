import { createServer } from 'http';

interface IServerOptions {
  readonly port?: number;
}

export default class Server {
  public http: any;

  private handler: any;
  private readonly port: number;

  constructor(handler: any, opts: IServerOptions = {}) {
    this.handler = handler;
    this.port = opts.port || 0;
  }

  public async start() {
    if (this.http) {
      throw new Error('cannot start server: server is already started');
    }
    this.http = createServer(this.handler);
    this.http.listen(this.port);
    return new Promise((resolve, reject) => {
      this.http.once('listening', () => resolve(this));
      this.http.once('error', reject);
    });
  }

  public async stop() {
    if (!this.http) {
      throw new Error('cannot stop server: server is not started');
    }
    const wait = this.wait();
    const h = this.http;
    this.http = null;
    h.close();
    return wait;
  }

  public async wait() {
    if (!this.http) {
      throw new Error('cannot wait on server: server is not started');
    }
    return new Promise((resolve, reject) => {
      this.http.once('close', resolve);
      this.http.once('error', reject);
    });
  }

  public update(handler: any) {
    const oldHandler = this.handler;
    this.handler = handler;
    if (!this.http) {
      return;
    }
    this.http.removeListener('request', oldHandler);
    this.http.on('request', this.handler);
  }

}
