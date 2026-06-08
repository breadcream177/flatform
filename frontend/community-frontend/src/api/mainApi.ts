import { API_BASE_URL, requestApi } from './apiClient';

const MAIN_BASE_URL = `${API_BASE_URL}/api/main`;

export interface MainPostPreview {
  id: number;
  boardName: string;
  username: string;
  nickname: string;
  title: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface MainNewsPreview {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  originallink: string;
  imageUrl: string | null;
}

export interface MainWeatherPreview {
  location: string;
  temperature: number;
  highTemperature: number | null;
  lowTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  weatherText: string;
  updatedAt: string;
}

export interface MainExchangeRatePreview {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  date: string;
}

export interface MainShoppingPreview {
  title: string;
  link: string;
  imageUrl: string;
  price: number | null;
  mallName: string;
}

export interface MainMarketStockPreview {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface MainWebtoonPreview {
  title: string;
  link: string;
  imageUrl: string;
}

export interface MainSummaryResponse {
  posts: MainPostPreview[];
  news: MainNewsPreview[];
  weather: MainWeatherPreview | null;
  exchangeRate: MainExchangeRatePreview | null;
  marketStocks: MainMarketStockPreview[];
  shoppingItems: MainShoppingPreview[];
  webtoonItems: MainWebtoonPreview[];
  newsError: string | null;
  weatherError: string | null;
  exchangeError: string | null;
  marketError: string | null;
  shoppingError: string | null;
  webtoonError: string | null;
}

export function fetchMainSummary(): Promise<MainSummaryResponse> {
  return requestApi<MainSummaryResponse>(
    `${MAIN_BASE_URL}/summary`,
    undefined,
    '메인 요약 정보를 불러오지 못했습니다.'
  );
}

export function fetchMainNews(keyword: string): Promise<MainNewsPreview[]> {
  const query = encodeURIComponent(keyword);

  return requestApi<MainNewsPreview[]>(
    `${MAIN_BASE_URL}/news?keyword=${query}`,
    undefined,
    '뉴스 정보를 불러오지 못했습니다.'
  );
}

export function fetchMainShopping(
  keyword: string
): Promise<MainShoppingPreview[]> {
  const query = encodeURIComponent(keyword);

  return requestApi<MainShoppingPreview[]>(
    `${MAIN_BASE_URL}/shopping?keyword=${query}`,
    undefined,
    '쇼핑 정보를 불러오지 못했습니다.'
  );
}

export function fetchMainWebtoons(
  week: string
): Promise<MainWebtoonPreview[]> {
  const query = encodeURIComponent(week);

  return requestApi<MainWebtoonPreview[]>(
    `${MAIN_BASE_URL}/webtoons?week=${query}`,
    undefined,
    '웹툰 정보를 불러오지 못했습니다.'
  );
}
