import {nowHuman} from "../lib/Common.js";

export default class NewsService {
  constructor() {
    this.max = 30;
    this.lastNews = [];
  }

  add(news) {
    let day = nowHuman();
    this.lastNews.splice(0, 0, day + " | " + news);
    if (this.lastNews.length > this.max) {
        this.lastNews.splice(this.lastNews.length-1, 1);
    }
  }

  getNews() {
    return this.lastNews;
  }
}