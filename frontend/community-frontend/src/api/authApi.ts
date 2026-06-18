import { API_BASE_URL, requestApi } from './apiClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponseData {
  success: boolean;
  message: string;
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  nickname: string;
  realName?: string;
}

export interface UpdateNicknameRequest {
  userId: number;
  nickname: string;
}

export interface AccountRecoveryResponse {
  message: string;
}

export interface FindUsernameRequest {
  email: string;
}

export interface PasswordResetRequest {
  username: string;
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

function validateAuthData(
  data: AuthResponseData,
  defaultMessage: string
): AuthResponseData {
  if (!data.success) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

export async function loginUser(
  request: LoginRequest
): Promise<AuthResponseData> {
  const data = await requestApi<AuthResponseData>(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '로그인에 실패했습니다.'
  );

  return validateAuthData(data, '로그인에 실패했습니다.');
}

export function signupUser(request: SignupRequest): Promise<unknown> {
  return requestApi<unknown>(
    `${API_BASE_URL}/api/auth/signup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '회원가입에 실패했습니다.'
  );
}

export function findUsername(
  request: FindUsernameRequest
): Promise<AccountRecoveryResponse> {
  return requestApi<AccountRecoveryResponse>(
    `${API_BASE_URL}/api/auth/find-username`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '아이디 찾기 요청에 실패했습니다.'
  );
}

export function requestPasswordReset(
  request: PasswordResetRequest
): Promise<AccountRecoveryResponse> {
  return requestApi<AccountRecoveryResponse>(
    `${API_BASE_URL}/api/auth/password-reset/request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '비밀번호 재설정 메일 요청에 실패했습니다.'
  );
}

export function confirmPasswordReset(
  request: PasswordResetConfirmRequest
): Promise<AccountRecoveryResponse> {
  return requestApi<AccountRecoveryResponse>(
    `${API_BASE_URL}/api/auth/password-reset/confirm`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '비밀번호 변경에 실패했습니다.'
  );
}

export async function updateNickname(
  request: UpdateNicknameRequest
): Promise<AuthResponseData> {
  const data = await requestApi<AuthResponseData>(
    `${API_BASE_URL}/api/auth/nickname`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '닉네임 수정에 실패했습니다.'
  );

  return validateAuthData(data, '닉네임 수정에 실패했습니다.');
}
