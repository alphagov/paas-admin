declare module 'notifications-node-client' {
  interface IResponse {
    readonly body: {
      readonly id: string;
      readonly reference: string | null;
      readonly content: {
        readonly subject: string;
        readonly body: string;
        readonly from_email: string;
      };
      readonly uri: string;
      readonly template: {
        readonly id: string;
        readonly version: number;
        readonly uri: string;
      };
    };
    readonly status: number;
  }

  export class NotifyClient {
    constructor(apiKey: string);
    sendEmail(
      template: string,
      email: string,
      params?: {
        readonly personalisation?: object;
        readonly reference?: string;
        readonly emailReplyToId?: string;
      },
    ): Promise<IResponse>;
  }
}
