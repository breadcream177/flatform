import type { AiErrorType } from './searchTypes';

export function getSearchErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return '백엔드 서버에 연결할 수 없습니다. Spring Boot 서버가 실행 중인지 확인해주세요.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '검색 결과를 불러오지 못했습니다.';
}

export function getAiErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return 'AI 요약 서버에 연결할 수 없습니다. 백엔드 서버 상태를 확인해주세요.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'AI 요약 생성에 실패했습니다.';
}

export function getAiErrorType(error: unknown): AiErrorType {
  if (error instanceof TypeError) {
    return 'backend';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('quota')
      || message.includes('429')
      || message.includes('resource_exhausted')
      || message.includes('제한')
    ) {
      return 'quota';
    }

    if (
      message.includes('backend')
      || message.includes('spring boot')
      || message.includes('서버에 연결')
    ) {
      return 'backend';
    }
  }

  return 'general';
}

export function getAiErrorGuide(errorType: AiErrorType) {
  switch (errorType) {
    case 'quota':
      return 'Gemini 무료 요청 제한이 초과된 상태입니다. 잠시 후 다시 검색하거나, 아래 검색 결과와 추천 자료를 먼저 확인해주세요.';
    case 'backend':
      return 'Spring Boot 백엔드 서버 연결 상태를 확인해주세요. 서버를 켠 뒤 새로고침하면 AI 요약을 다시 요청할 수 있습니다.';
    case 'general':
      return 'AI 요약 생성 중 문제가 발생했습니다. 검색 결과는 정상적으로 볼 수 있으니 자료를 먼저 확인해주세요.';
    default:
      return '';
  }
}

