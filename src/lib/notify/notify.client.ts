import { NotifyClient } from 'notifications-node-client';

interface ITemplates {
  readonly [name: string]: string | null;
}

interface IConfig {
  readonly apiKey: string;
  readonly templates: ITemplates;
}

interface IWelcomeEmailParameters {
  readonly organisation: string;
  readonly url: string;
  readonly location: string;
}

export default class NotificationClient {
  private readonly client: NotifyClient;
  private readonly templates: ITemplates;

  constructor(config: IConfig) {
    this.client = new NotifyClient(config.apiKey);
    /* istanbul ignore next */
    this.templates = config.templates || {};
  }

  public async sendWelcomeEmail(
    emailAddress: string,
    personalisation: IWelcomeEmailParameters,
  ) {
    /* istanbul ignore next */
    if (!this.templates.welcome) {
      throw new Error('NotifyClient: templates.welcome: id is required');
    }

    const templateID = this.templates.welcome;

    return await this.client.sendEmail(templateID, emailAddress, {
      personalisation,
    });
  }
}
