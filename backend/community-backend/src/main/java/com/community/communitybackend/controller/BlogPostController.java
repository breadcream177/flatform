package com.community.communitybackend.controller;

import com.community.communitybackend.dto.blog.*;
import com.community.communitybackend.service.BlogPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogPostController {

    private final BlogPostService blogPostService;

    @GetMapping
    public List<BlogPostResponseDto> getAllPosts() {
        return blogPostService.getAllPosts();
    }

    @GetMapping("/{id}")
    public BlogPostResponseDto getPost(@PathVariable Long id) {
        return blogPostService.getPost(id);
    }

    @PostMapping
    public BlogPostResponseDto createPost(@RequestBody BlogPostCreateRequestDto dto) {
        return blogPostService.createPost(dto);
    }

    @PutMapping("/{id}")
    public BlogPostResponseDto updatePost(
            @PathVariable Long id,
            @RequestBody BlogPostUpdateRequestDto dto,
            @RequestParam Long userId
    ) {
        return blogPostService.updatePost(id, dto, userId);
    }

    @DeleteMapping("/{id}")
    public void deletePost(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        blogPostService.deletePost(id, userId);
    }
}
