import { PROPERTY_KEYS } from './config';
import type { WebhookUrls } from './types';

export class PropertiesStore {
  private readonly props: GoogleAppsScript.Properties.Properties;

  constructor(props?: GoogleAppsScript.Properties.Properties) {
    this.props = props ?? PropertiesService.getScriptProperties();
  }

  getWebhookUrls(): WebhookUrls {
    return {
      titleWebhookUrl: this.props.getProperty(PROPERTY_KEYS.titleWebhook),
      creatorWebhookUrl: this.props.getProperty(PROPERTY_KEYS.creatorWebhook),
    };
  }

  get(key: string): string | null {
    return this.props.getProperty(key);
  }

  set(key: string, value: string): void {
    this.props.setProperty(key, value);
  }

  delete(key: string): void {
    this.props.deleteProperty(key);
  }

  getAll(): Record<string, string> {
    return this.props.getProperties();
  }
}
