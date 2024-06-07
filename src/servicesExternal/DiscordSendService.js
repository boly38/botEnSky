import os from 'os';
import { Buffer } from 'node:buffer';

import discordJs from 'discord.js';

const hostname = os.hostname();
const IMAGE_URL = 'https://cdn.futura-sciences.com/buildsv6/images/wide1920/6/5/2/652a7adb1b_98148_01-intro-773.jpg';
const { EmbedBuilder, WebhookClient } = discordJs;

export default class DiscordSendService {

  constructor(applicationProperties) {
    this._config = applicationProperties;
    this.discordWebhookUrl = this._config.discordWebhookUrl;// https://discord.com/api/webhooks/xxx/yyy
    const {id, token} = extractFromDiscordUrl(this.discordWebhookUrl);
    this.discordWebhookId = id;
    this.discordWebhookToken = token;
    this.isEnabled = (isSet(this.discordWebhookId) && isSet(this.discordWebhookToken));
    if (this.isEnabled) {
      this.username = hostname + "-" + this._config.nodeEnv;
      this.hook = new WebhookClient({ id: this.discordWebhookId, token: this.discordWebhookToken });
      this.embed = new EmbedBuilder().setColor(0xFF00FF);
    }
  }

  isDiscordEnabled() {
    return this.isEnabled;
  }

  async sendMessage(content) {
    if (!this.isDiscordEnabled()) {
      console.log("* DISCORD DISABLED * | " + content);
      return Promise.resolve();
    }
    // https://discordjs.guide/popular-topics/webhooks.html#sending-messages
    if (content.length < 2000) {
      await this.hook.send({ content, username: this.username, avatarURL: IMAGE_URL });
    } else {
      const name = `msg-${nowTs()}.txt`;
      const attachment = Buffer.from(content);
      const partialContent = content.substring(0, 500) + '...';
      /// send with 'files' produces a warn about buffer.Blob is an experimental feature // files: array of https://discord.js.org/#/docs/main/stable/typedef/MessageFile
      await this.hook.send({ content: partialContent, username: this.username, avatarURL: IMAGE_URL, files: [{attachment, name}] });
    }
    return Promise.resolve();
  }

}

function nowTs() {
  return new Date().getTime();
}

function isSet(variable) {
    return (variable !== undefined && variable !== null);
}

function extractFromDiscordUrl(url) {
  // url: https://discord.com/api/webhooks/(id)/(token)
  const regexp = "https://discord.com/api/webhooks/([^/]*)/([^/]*)(/)?";
  if (!isSet(url)) {
    return {};
  }
  const result = url.match(regexp);
  // DEBUG // console.log("extractFromDiscordUrl", result);
  if (!isSet(result)) {
    return {};
  }
  const id = isSet(result[1]) ? result[1] : null;
  const token = isSet(result[2]) ? result[2] : null;
  return {id, token};
}