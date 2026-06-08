import { API_BASE_URL, requestApi, requestApiVoid } from './apiClient';

export interface TodoItem {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCreateRequest {
  userId: number;
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
}

export interface TodoUpdateRequest {
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
}

export function getTodosByUserId(userId: number): Promise<TodoItem[]> {
  return requestApi<TodoItem[]>(
    `${API_BASE_URL}/api/todos/user/${userId}`,
    undefined,
    'Todo 목록 조회에 실패했습니다.'
  );
}

export function createTodo(request: TodoCreateRequest): Promise<TodoItem> {
  return requestApi<TodoItem>(
    `${API_BASE_URL}/api/todos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    'Todo 등록에 실패했습니다.'
  );
}

export function updateTodoStatus(
  todoId: number,
  status: string
): Promise<TodoItem> {
  return requestApi<TodoItem>(
    `${API_BASE_URL}/api/todos/${todoId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
    'Todo 상태 변경에 실패했습니다.'
  );
}

export function deleteTodo(todoId: number): Promise<void> {
  return requestApiVoid(
    `${API_BASE_URL}/api/todos/${todoId}`,
    {
      method: 'DELETE',
    },
    'Todo 삭제에 실패했습니다.'
  );
}

export function updateTodo(
  todoId: number,
  request: TodoUpdateRequest
): Promise<TodoItem> {
  return requestApi<TodoItem>(
    `${API_BASE_URL}/api/todos/${todoId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    'Todo 수정에 실패했습니다.'
  );
}
