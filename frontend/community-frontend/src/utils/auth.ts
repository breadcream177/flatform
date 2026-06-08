import type { LoginUser } from '../types/auth';

export function getStoredLoginUser(): LoginUser | null {
  const storedUser = localStorage.getItem('loginUser');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as LoginUser;
  } catch (error) {
    console.error('로그인 사용자 정보 파싱 실패:', error);
    localStorage.removeItem('loginUser');
    return null;
  }
}