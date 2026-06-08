import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuth2RedirectPage() {
  const navigate = useNavigate();
  const isHandledRef = useRef(false);

  useEffect(() => {
    if (isHandledRef.current) {
      return;
    }

    isHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);

    const userId = params.get('userId');
    const username = params.get('username');
    const nickname = params.get('nickname');
    const role = params.get('role');

    console.log('oauth2 search =', window.location.search);
    console.log('oauth2 params =', { userId, username, nickname, role });

    if (!userId || !username || !nickname || !role) {
      alert('소셜 로그인 처리에 실패했습니다.');
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem(
      'loginUser',
      JSON.stringify({
        userId: Number(userId),
        username,
        nickname,
        role,
      })
    );

    navigate('/mypage', { replace: true });
  }, [navigate]);

  return <div>소셜 로그인 처리 중입니다...</div>;
}

export default OAuth2RedirectPage;