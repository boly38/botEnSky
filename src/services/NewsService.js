import {nowHuman} from "../lib/Common.js";

export default class NewsService {
  constructor(loggerService) {
    this.max = 30;
    this.lastNews = [];
    this.logger = loggerService.getLogger().child({ label: 'News 📢' });
  }

  add(news) {
    let day = nowHuman();
    this.lastNews.splice(0, 0, day + " | " + news);
    if (this.lastNews.length > this.max) {
        this.lastNews.splice(this.lastNews.length-1, 1);
    }
    this.logger.info(news);
  }

  getNews() {
    return this.lastNews;
  }
}