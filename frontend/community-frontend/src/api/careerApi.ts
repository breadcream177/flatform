import { API_BASE_URL, requestApi } from './apiClient';

const CAREER_BASE_URL = `${API_BASE_URL}/api/career`;

export interface CareerPortalParams {
  keyword?: string | number;
  region?: string | number;
  minSalary?: string | number;
  maxSalary?: string | number;
}

export interface JobPosting {
  title: string;
  company: string;
  region: string;
  salary: string;
  minSalary: number | null;
  maxSalary: number | null;
  career: string;
  education: string;
  employmentType: string;
  closeDate: string;
  sourceName: string;
  originalUrl: string;
  jobType: string;
}

export interface CertificationSite {
  name: string;
  organization: string;
  description: string;
  scheduleUrl: string;
  applyUrl: string;
  imageUrl: string;
  detailUrl: string;
  status: string;
  tags: string[];
}

export interface ContestInfo {
  title: string;
  organization: string;
  description: string;
  category: string;
  period: string;
  imageUrl: string;
  detailUrl: string;
  sourceName: string;
  tags: string[];
}

export interface CareerRecordCard {
  title: string;
  description: string;
  path: string;
  tag: string;
}

export interface CareerPortalResponse {
  jobPostings: JobPosting[];
  certificationSites: CertificationSite[];
  contestInfos: ContestInfo[];
  careerRecordCards: CareerRecordCard[];
  jobError: string | null;
  certificationNotice: string | null;
  contestError: string | null;
  sourceStatus: string;
}

function appendParam(searchParams: URLSearchParams, key: string, value?: string | number) {
  const normalizedValue = String(value ?? '').trim();

  if (normalizedValue) {
    searchParams.set(key, normalizedValue);
  }
}

function buildCareerParams(params: CareerPortalParams) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, 'keyword', params.keyword);
  appendParam(searchParams, 'region', params.region);
  appendParam(searchParams, 'minSalary', params.minSalary);
  appendParam(searchParams, 'maxSalary', params.maxSalary);

  return searchParams.toString();
}

export function fetchCareerPortal(
  params: CareerPortalParams = {}
): Promise<CareerPortalResponse> {
  const query = buildCareerParams(params);

  return requestApi<CareerPortalResponse>(
    `${CAREER_BASE_URL}/portal${query ? `?${query}` : ''}`,
    undefined,
    '커리어 포털 정보를 불러오지 못했습니다.'
  );
}

export function fetchJobPostings(params: CareerPortalParams = {}): Promise<JobPosting[]> {
  const query = buildCareerParams(params);

  return requestApi<JobPosting[]>(
    `${CAREER_BASE_URL}/jobs${query ? `?${query}` : ''}`,
    undefined,
    '채용 공고를 불러오지 못했습니다.'
  );
}
