package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.BoardResponseDto;
import com.community.communitybackend.dto.PostResponseDto;
import com.community.communitybackend.service.BoardService;
import com.community.communitybackend.service.PostService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class BoardController {

    private final BoardService boardService;
    private final PostService postService;

    public BoardController(BoardService boardService, PostService postService) {
        this.boardService = boardService;
        this.postService = postService;
    }

    @GetMapping("/api/boards")
    public ApiResponse<List<BoardResponseDto>> getBoards() {
        return ApiResponse.success(boardService.getBoards());
    }

    @GetMapping("/api/boards/{boardId}")
    public ApiResponse<BoardResponseDto> getBoardById(@PathVariable Long boardId) {
        return ApiResponse.success(boardService.getBoardById(boardId));
    }

    @GetMapping("/api/boards/{boardId}/posts")
    public ApiResponse<List<PostResponseDto>> getPostsByBoardId(@PathVariable Long boardId) {
        return ApiResponse.success(postService.getPostsByBoardId(boardId));
    }
}