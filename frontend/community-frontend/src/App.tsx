import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MainPage from './pages/main/MainPage';
import PostListPage from './pages/post/PostListPage';
import PostCreatePage from './pages/post/PostCreatePage';
import PostDetailPage from './pages/post/PostDetailPage';
import PostEditPage from './pages/post/PostEditPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import MyPage from './pages/user/MyPage';
import TodoPage from './pages/todo/TodoPage';
import BlogListPage from './pages/blog/BlogListPage';
import BlogDetailPage from './pages/blog/BlogDetailPage';
import BlogCreatePage from './pages/blog/BlogCreatePage';
import BlogEditPage from './pages/blog/BlogEditPage';
import SearchPage from './pages/search/SearchPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/create" element={<PostCreatePage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/posts/:postId/edit" element={<PostEditPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/todos" element={<TodoPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/blog/create" element={<BlogCreatePage />} />
        <Route path="/blog/:id/edit" element={<BlogEditPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}

export default App;