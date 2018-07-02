import { NotifyClient } from 'notifications-node-client';

import { IParameters } from '../router';

interface ITemplates {
  readonly [name: string]: string | null;
}

interface IConfig {
  readonly apiKey: string;
  readonly templates: ITemplates;
}

export default class NotificationClient {
  private readonly client: NotifyClient;
  private readonly templates: ITemplates;

  constructor(config: IConfig) {
    this.client = new NotifyClient(config.apiKey);
    /* istanbul ignore next */
    this.templates = config.templates || {};
  }

  public sendWelcomeEmail(emailAddress: string, personalisation: IParameters = {}) {
    /* istanbul ignore next */
    if (!this.templates.welcome) {
      throw new Error(`notifications: templates.welcome: id is required`);
    }

    const templateID = this.templates.welcome;

    return this.client.sendEmail(templateID, emailAddress, {
      personalisation,
    });
  }
}
