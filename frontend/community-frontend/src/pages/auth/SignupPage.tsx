import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupUser } from '../../api/authApi';
import './SignupPage.css';

function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    nickname: '',
    realName: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const username = form.username.trim();
    const email = form.email.trim();
    const nickname = form.nickname.trim();
    const realName = form.realName.trim();
    const password = form.password;

    if (!username) {
      setError('아이디를 입력해주세요.');
      return;
    }

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상 입력해주세요.');
      return;
    }

    if (!nickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await signupUser({
        username,
        email,
        password,
        nickname,
        realName,
      });

      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('회원가입 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <button
          type="button"
          className="signup-back-button"
          onClick={() => navigate('/')}
        >
          ← 메인으로
        </button>

        <div className="signup-card">
          <div className="signup-brand-area">
            <h1 className="signup-brand-title">Between Jobs</h1>
            <p className="signup-brand-subtitle">
              새로운 계정을 만들고 커뮤니티와 생산성 기능을 시작해보세요.
            </p>
          </div>

          <form className="signup-form" onSubmit={handleSignup}>
            <div className="signup-field-group">
              <label className="signup-label" htmlFor="signup-username">
                아이디
              </label>
              <input
                id="signup-username"
                type="text"
                className="signup-input"
                placeholder="아이디를 입력하세요"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="signup-field-group">
              <label className="signup-label" htmlFor="signup-email">
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                className="signup-input"
                placeholder="이메일을 입력하세요"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                required
              />
              <p className="signup-helper-text">
                아이디 찾기와 비밀번호 재설정 메일을 받을 주소입니다.
              </p>
            </div>

            <div className="signup-field-group">
              <label className="signup-label" htmlFor="signup-password">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                className="signup-input"
                placeholder="6자 이상 입력하세요"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <p className="signup-helper-text">
                비밀번호 찾기 기능과 동일하게 6자 이상으로 저장됩니다.
              </p>
            </div>

            <div className="signup-field-group">
              <label className="signup-label" htmlFor="signup-nickname">
                닉네임
              </label>
              <input
                id="signup-nickname"
                type="text"
                className="signup-input"
                placeholder="닉네임을 입력하세요"
                value={form.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                autoComplete="nickname"
                required
              />
            </div>

            <div className="signup-field-group">
              <label className="signup-label" htmlFor="signup-realname">
                이름
              </label>
              <input
                id="signup-realname"
                type="text"
                className="signup-input"
                placeholder="이름을 입력하세요 (선택)"
                value={form.realName}
                onChange={(e) => handleChange('realName', e.target.value)}
                autoComplete="name"
              />
            </div>

            {error && <div className="signup-error-message">{error}</div>}

            <button
              type="submit"
              className="signup-submit-button"
              disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="signup-bottom-row">
            <span>이미 계정이 있으신가요?</span>
            <button type="button" onClick={() => navigate('/login')}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
