import {NotifyClient} from 'notifications-node-client';

export default class NotifcationClient {

  constructor({apiKey, templates}) {
    this.client = new NotifyClient(apiKey);
    this.templates = templates || {};
  }

  sendWelcomeEmail(emailAddress, personalisation) {
    if (!this.templates.welcome) {
      throw new Error(`notifications: templates.welcome: id is required`);
    }
    const templateID = this.templates.welcome;
    return this.client.sendEmail(templateID, emailAddress, {
      personalisation
    });
  }
}
