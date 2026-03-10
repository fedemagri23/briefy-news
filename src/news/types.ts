export interface NewsSource {
  name: string;
  url: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: NewsSource;
}

export interface NewsSection {
  type: "argentina" | "international";
  news: NewsItem[];
}

export interface NewsDigest {
  date: string;
  sections: NewsSection[];
}