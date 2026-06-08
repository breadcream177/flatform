import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlogPost, updateBlogPost } from '../../api/blogApi';
import './BlogPage.css';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

const CATEGORIES = ['개발', '프로젝트', '취업준비', '일상', '회고'];

function BlogEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loginUserRaw = localStorage.getItem('loginUser');
  const loginUser: LoginUser | null = loginUserRaw ? JSON.parse(loginUserRaw) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('개발');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    if (!id) return;

    getBlogPost(Number(id))
      .then((blog) => {
        setTitle(blog.title);
        setContent(blog.content);
        setCategory(blog.category);
        setThumbnailUrl(blog.thumbnailUrl ?? '');
      })
      .catch((err) => {
        console.error(err);
        alert('블로그 글을 불러오지 못했습니다.');
        navigate('/blog');
      });
  }, [id, navigate]);

  if (!loginUser) {
    return (
      <div className="blog-page">
        <div className="blog-empty">
          <h3>로그인이 필요합니다.</h3>
          <p>블로그 글을 수정하려면 먼저 로그인해주세요.</p>
          <button onClick={() => navigate('/login')}>로그인하러 가기</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!id) return;

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const updated = await updateBlogPost(Number(id), loginUser.userId, {
        title,
        content,
        category,
        thumbnailUrl,
      });

      alert('수정되었습니다.');
      navigate(`/blog/${updated.id}`);
    } catch (err) {
      console.error(err);
      alert('수정에 실패했습니다.');
    }
  };

  return (
    <div className="blog-page">
      <section className="blog-form-card">
        <h1>블로그 글 수정</h1>

        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>카테고리</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label>썸네일 이미지 URL</label>
        <input
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="없으면 비워도 됩니다."
        />

        <label>내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />

        <div className="blog-form-actions">
          <button onClick={() => navigate(`/blog/${id}`)}>취소</button>
          <button className="primary" onClick={handleSubmit}>
            수정 완료
          </button>
        </div>
      </section>
    </div>
  );
}

export default BlogEditPage;