import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findUsername } from '../../api/authApi';
import './AccountRecoveryPage.css';

function FindAccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetEmail = email.trim();

    if (!targetEmail) {
      setError('가입한 이메일을 입력해주세요.');
      setMessage('');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const result = await findUsername({ email: targetEmail });
      setMessage(result.message);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '아이디 찾기 요청 중 오류가 발생했습니다.'
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
            <h1>아이디 찾기</h1>
            <p>가입한 이메일로 아이디 안내 메일을 발송합니다.</p>
          </div>

          <div className="account-recovery-info-box">
            보안을 위해 일치하는 계정이 있는 경우에만 메일이 발송되며,
            화면에서는 계정 존재 여부를 직접 표시하지 않습니다.
          </div>

          <form className="account-recovery-form" onSubmit={handleSubmit}>
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
              {submitting ? '메일 요청 중...' : '아이디 안내 메일 받기'}
            </button>
          </form>

          <div className="account-recovery-bottom-row">
            <button type="button" onClick={() => navigate('/password-reset/request')}>
              비밀번호 찾기
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

export default FindAccountPage;
