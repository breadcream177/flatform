import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlogPosts } from '../../api/blogApi';
import type { BlogPost } from '../../api/blogApi';
import './BlogPage.css';

const CATEGORIES = ['전체', '개발', '프로젝트', '취업준비', '일상', '회고'];

function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getBlogPosts()
      .then(setBlogs)
      .catch((err) => {
        console.error(err);
        alert('블로그 목록을 불러오지 못했습니다.');
      });
  }, []);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const categoryMatched =
        selectedCategory === '전체' || blog.category === selectedCategory;

      const keywordMatched =
        blog.title.toLowerCase().includes(keyword.toLowerCase()) ||
        blog.content.toLowerCase().includes(keyword.toLowerCase());

      return categoryMatched && keywordMatched;
    });
  }, [blogs, selectedCategory, keyword]);

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div>
          <p className="blog-hero-label">Between Jobs Blog</p>
          <h1>기록하고 정리하는 블로그</h1>
          <p>
            프로젝트 기록, 개발 학습, 취업 준비 과정과 생각들을 정리하는 공간입니다.
          </p>
        </div>

        <button className="blog-write-button" onClick={() => navigate('/blog/create')}>
          글쓰기
        </button>
      </section>

      <section className="blog-toolbar">
        <div className="blog-category-tabs">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <input
          className="blog-search-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="블로그 글 검색"
        />
      </section>

      <section className="blog-grid">
        {filteredBlogs.length === 0 ? (
          <div className="blog-empty">
            <h3>아직 표시할 블로그 글이 없습니다.</h3>
            <p>첫 번째 글을 작성해보세요.</p>
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <article
              key={blog.id}
              className="blog-card"
              onClick={() => navigate(`/blog/${blog.id}`)}
            >
              <div className={`blog-card-thumbnail category-${blog.category}`}>
                {blog.thumbnailUrl ? (
                  <img src={blog.thumbnailUrl} alt={blog.title} />
                ) : (
                  <div className="blog-default-thumbnail">
                    <span>{blog.category}</span>
                    <strong>Between Jobs Blog</strong>
                  </div>
                )}
              </div>

              <div className="blog-card-body">
                <span className="blog-card-category">{blog.category}</span>
                <h2>{blog.title}</h2>
                <p>{blog.content.slice(0, 80)}...</p>

                <div className="blog-card-meta">
                  <span>{blog.author}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default BlogListPage;