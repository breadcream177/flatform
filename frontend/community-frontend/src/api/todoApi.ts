import { API_BASE_URL, requestApi, requestApiVoid } from './apiClient';

const TODO_BASE_URL = `${API_BASE_URL}/api/todos`;

export type TodoStatus = 'PENDING' | 'DONE';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TodoItem {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCreateRequest {
  userId: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: string;
}

export interface TodoUpdateRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: string;
  status: string;
}

export function getTodosByUserId(userId: number): Promise<TodoItem[]> {
  return requestApi<TodoItem[]>(
    `${TODO_BASE_URL}/user/${userId}`,
    undefined,
    'Todo 목록을 불러오지 못했습니다.'
  );
}

export function createTodo(request: TodoCreateRequest): Promise<TodoItem> {
  return requestApi<TodoItem>(
    TODO_BASE_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    'Todo를 추가하지 못했습니다.'
  );
}

export function updateTodo(id: number, request: TodoUpdateRequest): Promise<TodoItem> {
  return requestApi<TodoItem>(
    `${TODO_BASE_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    'Todo를 수정하지 못했습니다.'
  );
}

export function updateTodoStatus(id: number, status: string): Promise<TodoItem> {
  return requestApi<TodoItem>(
    `${TODO_BASE_URL}/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
    'Todo 상태를 변경하지 못했습니다.'
  );
}

export function deleteTodo(id: number): Promise<void> {
  return requestApiVoid(
    `${TODO_BASE_URL}/${id}`,
    {
      method: 'DELETE',
    },
    'Todo를 삭제하지 못했습니다.'
  );
}
