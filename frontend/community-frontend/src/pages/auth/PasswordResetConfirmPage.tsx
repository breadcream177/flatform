import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../../api/authApi';
import './AccountRecoveryPage.css';

function PasswordResetConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError('비밀번호 재설정 토큰이 없습니다. 메일의 링크로 다시 접속해주세요.');
      setMessage('');
      return;
    }

    if (newPassword.trim().length < 6) {
      setError('새 비밀번호는 6자 이상 입력해주세요.');
      setMessage('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      setMessage('');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const result = await confirmPasswordReset({
        token,
        newPassword,
      });

      setMessage(result.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '비밀번호 변경 중 오류가 발생했습니다.'
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
            <h1>새 비밀번호 설정</h1>
            <p>메일로 받은 재설정 링크가 유효한 동안 새 비밀번호를 저장합니다.</p>
          </div>

          {!token && (
            <div className="account-recovery-message error">
              메일의 비밀번호 재설정 링크로 다시 접속해주세요.
            </div>
          )}

          <form className="account-recovery-form" onSubmit={handleSubmit}>
            <label className="account-recovery-label">
              새 비밀번호
              <input
                type="password"
                className="account-recovery-input"
                placeholder="6자 이상 입력하세요."
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={!token}
              />
            </label>

            <label className="account-recovery-label">
              새 비밀번호 확인
              <input
                type="password"
                className="account-recovery-input"
                placeholder="새 비밀번호를 한 번 더 입력하세요."
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={!token}
              />
            </label>

            {message && (
              <div className="account-recovery-message success">
                <p>{message}</p>
                <button type="button" onClick={() => navigate('/login')}>
                  로그인하러 가기
                </button>
              </div>
            )}
            {error && (
              <div className="account-recovery-message error">{error}</div>
            )}

            <button
              type="submit"
              className="account-recovery-submit"
              disabled={submitting || !token}
            >
              {submitting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>

          <div className="account-recovery-bottom-row">
            <button type="button" onClick={() => navigate('/login')}>
              로그인하기
            </button>
            <span>|</span>
            <button type="button" onClick={() => navigate('/password-reset/request')}>
              재설정 메일 다시 받기
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;
