import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTodo,
  deleteTodo,
  getTodosByUserId,
  updateTodo,
  updateTodoStatus,
} from '../../api/todoApi';
import type { TodoItem } from '../../api/todoApi';
import './TodoPage.css';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

type TodoFilter = 'ALL' | 'PENDING' | 'DONE';

function TodoPage() {
  const navigate = useNavigate();

  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TodoFilter>('ALL');

  const syncLoginUser = () => {
    const storedUser = localStorage.getItem('loginUser');

    if (!storedUser) {
      setLoginUser(null);
      return;
    }

    try {
      const parsedUser: LoginUser = JSON.parse(storedUser);
      setLoginUser(parsedUser);
    } catch (error) {
      console.error('로그인 사용자 정보 파싱 실패:', error);
      localStorage.removeItem('loginUser');
      setLoginUser(null);
    }
  };

  const loadTodos = async (userId: number) => {
    try {
      setLoading(true);
      const todoList = await getTodosByUserId(userId);
      setTodos(todoList);
    } catch (error) {
      console.error(error);
      alert('할 일 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncLoginUser();
  }, []);

  useEffect(() => {
    if (loginUser) {
      loadTodos(loginUser.userId);
      return;
    }

    setLoading(false);
  }, [loginUser]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('MEDIUM');
    setEditingTodoId(null);
  };

  const handleSubmit = async () => {
    if (!loginUser) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      if (editingTodoId !== null) {
        const targetTodo = todos.find((todo) => todo.id === editingTodoId);

        if (!targetTodo) {
          alert('수정할 할 일을 찾을 수 없습니다.');
          return;
        }

        await updateTodo(editingTodoId, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || null,
          priority,
          status: targetTodo.status,
        });

        alert('할 일이 수정되었습니다.');
      } else {
        await createTodo({
          userId: loginUser.userId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || null,
          priority,
        });

        alert('할 일이 등록되었습니다.');
      }

      resetForm();
      await loadTodos(loginUser.userId);
    } catch (error) {
      console.error(error);
      alert(
        editingTodoId !== null
          ? '할 일 수정에 실패했습니다.'
          : '할 일 등록에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setTitle(todo.title);
    setDescription(todo.description ?? '');
    setDueDate(todo.dueDate ?? '');
    setPriority(todo.priority);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (todo: TodoItem) => {
    if (!loginUser) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    const nextStatus = todo.status === 'DONE' ? 'PENDING' : 'DONE';

    try {
      await updateTodoStatus(todo.id, nextStatus);
      await loadTodos(loginUser.userId);
    } catch (error) {
      console.error(error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (todoId: number) => {
    if (!loginUser) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    const confirmed = window.confirm('이 할 일을 삭제하시겠습니까?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteTodo(todoId);

      if (editingTodoId === todoId) {
        resetForm();
      }

      await loadTodos(loginUser.userId);
      alert('할 일이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      alert('할 일 삭제에 실패했습니다.');
    }
  };

  const sortedTodos = useMemo(() => {
    const filteredTodos = todos.filter((todo) => {
      if (filter === 'ALL') return true;
      return todo.status === filter;
    });

    return [...filteredTodos].sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'PENDING') return -1;
        if (b.status === 'PENDING') return 1;
      }

      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return b.id - a.id;
    });
  }, [todos, filter]);

  const getPriorityLabel = (value: string) => {
    if (value === 'HIGH') return '높음';
    if (value === 'LOW') return '낮음';
    return '보통';
  };

  const getStatusLabel = (value: string) => {
    if (value === 'DONE') return '완료';
    return '진행중';
  };

  if (!loginUser) {
    return (
      <div className="todo-page">
        <div className="todo-page-container">
          <div className="todo-page-header">
            <h1>할 일 관리</h1>
            <button
              type="button"
              className="todo-back-button"
              onClick={() => navigate('/')}
            >
              메인으로 돌아가기
            </button>
          </div>

          <section className="todo-section">
            <p>로그인 후 이용 가능한 기능입니다.</p>
            <button
              type="button"
              className="todo-action-button"
              onClick={() => navigate('/login')}
            >
              로그인하러 가기
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-page">
      <div className="todo-page-container">
        <div className="todo-page-header">
          <h1>할 일 관리</h1>
          <button
            type="button"
            className="todo-back-button"
            onClick={() => navigate('/')}
          >
            메인으로 돌아가기
          </button>
        </div>

        <section className="todo-section">
          <h2>{editingTodoId !== null ? '할 일 수정' : '할 일 등록'}</h2>

          <div className="todo-form">
            <input
              type="text"
              placeholder="할 일 제목"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <textarea
              placeholder="상세 설명"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />

            <div className="todo-form-row">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />

              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
              </select>
            </div>

            <div className="todo-form-actions">
              <button
                type="button"
                className="todo-action-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? '처리 중...'
                  : editingTodoId !== null
                    ? '할 일 수정'
                    : '할 일 등록'}
              </button>

              {editingTodoId !== null && (
                <button
                  type="button"
                  className="todo-cancel-button"
                  onClick={resetForm}
                >
                  수정 취소
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="todo-section">
          <div className="todo-list-header">
            <h2>내 할 일 목록</h2>

            <div className="todo-filter-group">
              <button
                type="button"
                className={`todo-filter-button ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                전체
              </button>
              <button
                type="button"
                className={`todo-filter-button ${filter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setFilter('PENDING')}
              >
                진행중
              </button>
              <button
                type="button"
                className={`todo-filter-button ${filter === 'DONE' ? 'active' : ''}`}
                onClick={() => setFilter('DONE')}
              >
                완료
              </button>
            </div>
          </div>

          {loading ? (
            <p>불러오는 중...</p>
          ) : sortedTodos.length === 0 ? (
            <p>조건에 맞는 할 일이 없습니다.</p>
          ) : (
            <div className="todo-list">
              {sortedTodos.map((todo) => (
                <article
                  key={todo.id}
                  className={`todo-card ${todo.status === 'DONE' ? 'done' : ''}`}
                >
                  <div className="todo-card-header">
                    <div>
                      <h3>{todo.title}</h3>
                      <p className="todo-meta">
                        상태: {getStatusLabel(todo.status)}
                      </p>
                      <p
                        className={`todo-meta todo-priority priority-${todo.priority.toLowerCase()}`}
                      >
                        우선순위: {getPriorityLabel(todo.priority)}
                      </p>
                      {todo.dueDate && (
                        <p className="todo-meta">마감일: {todo.dueDate}</p>
                      )}
                    </div>
                  </div>

                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}

                  <div className="todo-card-actions">
                    <button
                      type="button"
                      className="todo-action-button"
                      onClick={() => handleToggleStatus(todo)}
                    >
                      {todo.status === 'DONE' ? '미완료로 변경' : '완료로 변경'}
                    </button>

                    <button
                      type="button"
                      className="todo-edit-button"
                      onClick={() => handleEdit(todo)}
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      className="todo-delete-button"
                      onClick={() => handleDelete(todo.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default TodoPage;