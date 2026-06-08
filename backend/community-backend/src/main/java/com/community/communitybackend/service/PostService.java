package com.community.communitybackend.service;

import com.community.communitybackend.dto.CommentResponseDto;
import com.community.communitybackend.dto.PostCreateRequestDto;
import com.community.communitybackend.dto.PostResponseDto;
import com.community.communitybackend.dto.PostUpdateRequestDto;
import com.community.communitybackend.entity.Board;
import com.community.communitybackend.entity.Post;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.BoardRepository;
import com.community.communitybackend.repository.CommentRepository;
import com.community.communitybackend.repository.PostRepository;
import com.community.communitybackend.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public PostService(
            PostRepository postRepository,
            BoardRepository boardRepository,
            UserRepository userRepository,
            CommentRepository commentRepository
    ) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    public List<PostResponseDto> getPosts() {
        return postRepository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(PostResponseDto::new)
                .toList();
    }

    public PostResponseDto getPostById(Long postId) {
        Post post = findActivePost(postId);
        return new PostResponseDto(post);
    }

    public List<PostResponseDto> getPostsByBoardId(Long boardId) {
        return postRepository.findByBoardIdAndDeletedFalseOrderByIdDesc(boardId)
                .stream()
                .map(PostResponseDto::new)
                .toList();
    }

    public Map<String, Object> getPostDetail(Long postId) {
        Post post = findActivePost(postId);

        List<CommentResponseDto> comments = commentRepository
                .findByPostIdAndDeletedFalseOrderByIdAsc(postId)
                .stream()
                .map(CommentResponseDto::new)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("post", new PostResponseDto(post));
        result.put("comments", comments);

        return result;
    }

    @Transactional
    public PostResponseDto createPost(PostCreateRequestDto request) {
        validateCreateRequest(request);

        String normalizedTitle = normalizeText(request.getTitle());
        String normalizedContent = normalizeText(request.getContent());

        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new IllegalArgumentException("게시판이 존재하지 않습니다. id=" + request.getBoardId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다. id=" + request.getUserId()));

        Post post = new Post(
                board,
                user,
                normalizedTitle,
                normalizedContent,
                "PUBLIC",
                0,
                0,
                false
        );

        Post savedPost = postRepository.save(post);

        return new PostResponseDto(savedPost);
    }

    @Transactional
    public PostResponseDto updatePost(Long postId, PostUpdateRequestDto request) {
        validateUpdateRequest(request);

        Post post = findActivePost(postId);

        boolean isOwner = request.getUserId() != null && post.getUser().getId().equals(request.getUserId());
        boolean isAdmin = isAdminRole(request.getRole());

        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("본인 또는 관리자만 게시글을 수정할 수 있습니다.");
        }

        String normalizedTitle = normalizeText(request.getTitle());
        String normalizedContent = normalizeText(request.getContent());

        post.update(normalizedTitle, normalizedContent);

        return new PostResponseDto(post);
    }

    @Transactional
    public void deletePost(Long postId, Long userId, String role) {
        if (userId == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        Post post = findActivePost(postId);

        boolean isOwner = post.getUser().getId().equals(userId);
        boolean isAdmin = isAdminRole(role);

        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("본인 또는 관리자만 게시글을 삭제할 수 있습니다.");
        }

        post.delete();
    }

    public List<PostResponseDto> getPostsByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다. id=" + userId));

        return postRepository.findByUserIdAndDeletedFalseOrderByIdDesc(userId)
                .stream()
                .map(PostResponseDto::new)
                .toList();
    }

    public List<PostResponseDto> searchPosts(String keyword, String sort) {
        String normalizedKeyword = normalizeKeyword(keyword);

        List<Post> posts;

        if (normalizedKeyword.isEmpty()) {
            posts = postRepository.findByDeletedFalseOrderByIdDesc();
        } else if ("sim".equalsIgnoreCase(sort)) {
            posts = postRepository.searchPostsByRelevance(normalizedKeyword);
        } else {
            posts = postRepository.searchPosts(normalizedKeyword);
        }

        return posts.stream()
                .map(PostResponseDto::fromEntity)
                .toList();
    }

    private Post findActivePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. id=" + postId));

        if (Boolean.TRUE.equals(post.getDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글입니다. id=" + postId);
        }

        return post;
    }

    private void validateCreateRequest(PostCreateRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("게시글 요청 정보가 없습니다.");
        }

        if (request.getBoardId() == null) {
            throw new IllegalArgumentException("게시판 정보가 올바르지 않습니다.");
        }

        if (request.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        validateTitle(request.getTitle());
        validateContent(request.getContent());
    }

    private void validateUpdateRequest(PostUpdateRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("게시글 수정 요청 정보가 없습니다.");
        }

        if (request.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        validateTitle(request.getTitle());
        validateContent(request.getContent());
    }

    private void validateTitle(String title) {
        String normalizedTitle = normalizeText(title);

        if (normalizedTitle.isEmpty()) {
            throw new IllegalArgumentException("제목을 입력해주세요.");
        }

        if (normalizedTitle.length() > 200) {
            throw new IllegalArgumentException("제목은 200자 이하로 입력해주세요.");
        }
    }

    private void validateContent(String content) {
        String normalizedContent = normalizeText(content);

        if (normalizedContent.isEmpty()) {
            throw new IllegalArgumentException("내용을 입력해주세요.");
        }
    }

    private String normalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    private boolean isAdminRole(String role) {
        return role != null && "ADMIN".equalsIgnoreCase(role.trim());
    }
}
