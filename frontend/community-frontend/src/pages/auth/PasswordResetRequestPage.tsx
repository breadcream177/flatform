import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../api/authApi';
import './AccountRecoveryPage.css';

function PasswordResetRequestPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetUsername = username.trim();
    const targetEmail = email.trim();

    if (!targetUsername || !targetEmail) {
      setError('아이디와 이메일을 모두 입력해주세요.');
      setMessage('');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const result = await requestPasswordReset({
        username: targetUsername,
        email: targetEmail,
      });

      setMessage(result.message);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '비밀번호 재설정 요청 중 오류가 발생했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-recovery-page">
      <div className="account-recovery-container">
        <button
          type="button"
          className="account-recovery-back-button"
          onClick={() => navigate('/login')}
        >
          로그인으로
        </button>

        <section className="account-recovery-card">
          <div className="account-recovery-header">
            <h1>비밀번호 찾기</h1>
            <p>아이디와 이메일이 일치하면 재설정 링크를 이메일로 발송합니다.</p>
          </div>

          <div className="account-recovery-info-box">
            재설정 링크는 30분 동안만 사용할 수 있습니다. 메일이 보이지
            않으면 스팸함과 입력한 이메일 주소를 함께 확인해주세요.
          </div>

          <form className="account-recovery-form" onSubmit={handleSubmit}>
            <label className="account-recovery-label">
              아이디
              <input
                type="text"
                className="account-recovery-input"
                placeholder="아이디를 입력하세요."
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="account-recovery-label">
              이메일
              <input
                type="email"
                className="account-recovery-input"
                placeholder="가입한 이메일을 입력하세요."
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            {message && (
              <div className="account-recovery-message success">
                <p>{message}</p>
                <button type="button" onClick={() => navigate('/login')}>
                  로그인으로 이동
                </button>
              </div>
            )}
            {error && (
              <div className="account-recovery-message error">{error}</div>
            )}

            <button
              type="submit"
              className="account-recovery-submit"
              disabled={submitting}
            >
              {submitting ? '메일 요청 중...' : '재설정 메일 받기'}
            </button>
          </form>

          <div className="account-recovery-bottom-row">
            <button type="button" onClick={() => navigate('/find-account')}>
              아이디 찾기
            </button>
            <span>|</span>
            <button type="button" onClick={() => navigate('/signup')}>
              회원가입
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PasswordResetRequestPage;
