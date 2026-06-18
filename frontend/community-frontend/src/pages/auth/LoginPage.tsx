import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../api/apiClient';
import { loginUser } from '../../api/authApi';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = loginId.trim();
    const userPassword = password;

    if (!username) {
      setErrorMessage('아이디를 입력해주세요.');
      return;
    }

    if (!userPassword) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const data = await loginUser({
        username,
        password: userPassword,
      });

      localStorage.setItem(
        'loginUser',
        JSON.stringify({
          userId: data.userId,
          username: data.username,
          nickname: data.nickname,
          role: data.role,
        })
      );

      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('로그인 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  };

  const handleNaverLogin = () => {
    alert('네이버 로그인은 아직 구현되지 않았습니다.');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button
          type="button"
          className="login-back-button"
          onClick={() => navigate('/')}
        >
          메인으로
        </button>

        <div className="login-card">
          <div className="login-brand-area">
            <h1 className="login-brand-title">Between Jobs</h1>
            <p className="login-brand-subtitle">
              계정으로 로그인하고 커뮤니티와 생산성 기능을 이용해보세요.
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label className="login-label">
              아이디
              <input
                type="text"
                className="login-input"
                placeholder="아이디를 입력하세요."
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="login-label">
              비밀번호
              <input
                type="password"
                className="login-input"
                placeholder="비밀번호를 입력하세요."
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage && (
              <div className="login-error-message">{errorMessage}</div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-link-row">
            <button type="button" onClick={() => navigate('/find-account')}>
              아이디 찾기
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => navigate('/password-reset/request')}
            >
              비밀번호 찾기
            </button>
            <span>|</span>
            <button type="button" onClick={() => navigate('/signup')}>
              회원가입
            </button>
          </div>

          <div className="social-login-section">
            <div className="social-divider">
              <span>또는 소셜 계정으로 로그인</span>
            </div>

            <div className="social-login-buttons">
              <button
                type="button"
                className="social-login-button google"
                onClick={handleGoogleLogin}
              >
                Google로 로그인
              </button>

              <button
                type="button"
                className="social-login-button kakao"
                onClick={handleKakaoLogin}
              >
                Kakao로 로그인
              </button>

              <button
                type="button"
                className="social-login-button naver"
                onClick={handleNaverLogin}
              >
                Naver로 로그인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
