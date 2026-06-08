package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.TodoCreateRequestDto;
import com.community.communitybackend.dto.TodoResponseDto;
import com.community.communitybackend.dto.TodoUpdateRequestDto;
import com.community.communitybackend.service.TodoService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @PostMapping
    public ApiResponse<TodoResponseDto> createTodo(@RequestBody TodoCreateRequestDto request) {
        return ApiResponse.success(todoService.createTodo(request));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<TodoResponseDto>> getTodosByUserId(@PathVariable Long userId) {
        return ApiResponse.success(todoService.getTodosByUserId(userId));
    }

    @PutMapping("/{todoId}")
    public ApiResponse<TodoResponseDto> updateTodo(
            @PathVariable Long todoId,
            @RequestBody TodoUpdateRequestDto request
    ) {
        return ApiResponse.success(todoService.updateTodo(todoId, request));
    }

    @DeleteMapping("/{todoId}")
    public ApiResponse<Void> deleteTodo(@PathVariable Long todoId) {
        todoService.deleteTodo(todoId);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{todoId}/status")
    public ApiResponse<TodoResponseDto> updateStatus(
            @PathVariable Long todoId,
            @RequestBody Map<String, String> request
    ) {
        return ApiResponse.success(todoService.updateStatus(todoId, request.get("status")));
    }
}