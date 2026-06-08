package com.community.communitybackend.service;

import com.community.communitybackend.dto.TodoCreateRequestDto;
import com.community.communitybackend.dto.TodoResponseDto;
import com.community.communitybackend.dto.TodoUpdateRequestDto;
import com.community.communitybackend.entity.Todo;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.TodoRepository;
import com.community.communitybackend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TodoService {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    public TodoService(TodoRepository todoRepository, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TodoResponseDto createTodo(TodoCreateRequestDto request) {
        validateCreateRequest(request);

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        String priority = normalizePriority(request.getPriority());

        Todo todo = new Todo(
                user,
                request.getTitle().trim(),
                request.getDescription(),
                request.getDueDate(),
                "PENDING",
                priority
        );

        Todo savedTodo = todoRepository.save(todo);
        return new TodoResponseDto(savedTodo);
    }

    public List<TodoResponseDto> getTodosByUserId(Long userId) {
        return todoRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TodoResponseDto::new)
                .toList();
    }

    @Transactional
    public TodoResponseDto updateTodo(Long todoId, TodoUpdateRequestDto request) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 할 일입니다."));

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목은 필수입니다.");
        }

        String priority = normalizePriority(request.getPriority());

        todo.update(
                request.getTitle().trim(),
                request.getDescription(),
                request.getDueDate(),
                priority
        );

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            todo.updateStatus(normalizeStatus(request.getStatus()));
        }

        return new TodoResponseDto(todo);
    }

    @Transactional
    public void deleteTodo(Long todoId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 할 일입니다."));

        todoRepository.delete(todo);
    }

    @Transactional
    public TodoResponseDto updateStatus(Long todoId, String status) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 할 일입니다."));

        todo.updateStatus(normalizeStatus(status));
        return new TodoResponseDto(todo);
    }

    private void validateCreateRequest(TodoCreateRequestDto request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("userId는 필수입니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목은 필수입니다.");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }

        String normalized = status.trim().toUpperCase();

        if (!normalized.equals("PENDING") && !normalized.equals("DONE")) {
            throw new IllegalArgumentException("status는 PENDING 또는 DONE만 가능합니다.");
        }

        return normalized;
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "MEDIUM";
        }

        String normalized = priority.trim().toUpperCase();

        if (!normalized.equals("LOW") &&
                !normalized.equals("MEDIUM") &&
                !normalized.equals("HIGH")) {
            throw new IllegalArgumentException("priority는 LOW, MEDIUM, HIGH만 가능합니다.");
        }

        return normalized;
    }
}