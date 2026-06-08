import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteBlogPost, getBlogPost } from '../../api/blogApi';
import type { BlogPost } from '../../api/blogApi';
import './BlogPage.css';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const loginUserRaw = localStorage.getItem('loginUser');
  const loginUser: LoginUser | null = loginUserRaw ? JSON.parse(loginUserRaw) : null;

  useEffect(() => {
    if (!id) return;

    getBlogPost(Number(id))
      .then(setBlog)
      .catch((err) => {
        console.error(err);
        alert('블로그 글을 불러오지 못했습니다.');
        navigate('/blog');
      });
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!blog || !loginUser) return;

    const confirmed = window.confirm('정말 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteBlogPost(blog.id, loginUser.userId);
      alert('삭제되었습니다.');
      navigate('/blog');
    } catch (err) {
      console.error(err);
      alert('삭제에 실패했습니다.');
    }
  };

  if (!blog) return <div className="blog-page">로딩중...</div>;

  const canEdit = loginUser && (loginUser.userId === blog.userId || loginUser.role === 'ADMIN');

  return (
    <div className="blog-page">
      <article className="blog-detail">
        <div className="blog-detail-header">
          <span className="blog-card-category">{blog.category}</span>
          <h1>{blog.title}</h1>

          <div className="blog-detail-author-box">
            <div className="blog-author-avatar">
              {blog.author?.slice(0, 1)}
            </div>
            <div>
              <strong>{blog.author}</strong>
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {blog.thumbnailUrl && (
          <div className="blog-detail-thumbnail">
            <img src={blog.thumbnailUrl} alt={blog.title} />
          </div>
        )}

        <div className="blog-detail-content">{blog.content}</div>

        <div className="blog-detail-actions">
          <button onClick={() => navigate('/blog')}>목록으로</button>

          {canEdit && (
            <>
              <button onClick={() => navigate(`/blog/${blog.id}/edit`)}>수정</button>
              <button className="danger" onClick={handleDelete}>
                삭제
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

export default BlogDetailPage;