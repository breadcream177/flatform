package com.community.communitybackend.service;

import com.community.communitybackend.dto.blog.BlogPostCreateRequestDto;
import com.community.communitybackend.dto.blog.BlogPostResponseDto;
import com.community.communitybackend.dto.blog.BlogPostUpdateRequestDto;
import com.community.communitybackend.entity.BlogPost;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.BlogPostRepository;
import com.community.communitybackend.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BlogPostService {

    private final BlogPostRepository blogPostRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BlogPostResponseDto> getAllPosts() {
        return blogPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(BlogPostResponseDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public BlogPostResponseDto getPost(Long id) {
        BlogPost post = findBlogPost(id);
        return new BlogPostResponseDto(post);
    }

    public BlogPostResponseDto createPost(BlogPostCreateRequestDto dto) {
        validateBlogPost(dto.getTitle(), dto.getContent(), dto.getCategory());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다. id=" + dto.getUserId()));

        BlogPost post = new BlogPost();
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setCategory(dto.getCategory());
        post.setThumbnailUrl(dto.getThumbnailUrl());
        post.setUser(user);

        return new BlogPostResponseDto(blogPostRepository.save(post));
    }

    public BlogPostResponseDto updatePost(Long id, BlogPostUpdateRequestDto dto, Long userId) {
        validateBlogPost(dto.getTitle(), dto.getContent(), dto.getCategory());

        BlogPost post = findBlogPost(id);

        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("블로그 글 수정 권한이 없습니다.");
        }

        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setCategory(dto.getCategory());
        post.setThumbnailUrl(dto.getThumbnailUrl());

        return new BlogPostResponseDto(blogPostRepository.save(post));
    }

    public void deletePost(Long id, Long userId) {
        BlogPost post = findBlogPost(id);

        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("블로그 글 삭제 권한이 없습니다.");
        }

        blogPostRepository.delete(post);
    }

    private BlogPost findBlogPost(Long id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("블로그 글을 찾을 수 없습니다. id=" + id));
    }

    private void validateBlogPost(String title, String content, String category) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("제목을 입력해주세요.");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("내용을 입력해주세요.");
        }

        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("카테고리를 선택해주세요.");
        }
    }
}
