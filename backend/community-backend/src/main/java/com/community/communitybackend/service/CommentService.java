package com.community.communitybackend.service;

import com.community.communitybackend.dto.CommentCreateRequestDto;
import com.community.communitybackend.dto.CommentResponseDto;
import com.community.communitybackend.dto.CommentUpdateRequestDto;
import com.community.communitybackend.entity.Comment;
import com.community.communitybackend.entity.Post;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.CommentRepository;
import com.community.communitybackend.repository.PostRepository;
import com.community.communitybackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponseDto createComment(CommentCreateRequestDto request) {
        validateCreateRequest(request);

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. id=" + request.getPostId()));

        if (Boolean.TRUE.equals(post.getDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글에는 댓글을 작성할 수 없습니다. id=" + request.getPostId());
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다. id=" + request.getUserId()));

        Comment comment = new Comment(
                post,
                user,
                normalizeText(request.getContent()),
                false
        );

        Comment savedComment = commentRepository.save(comment);
        post.increaseCommentCount();

        return new CommentResponseDto(savedComment);
    }

    public List<CommentResponseDto> getCommentsByPostId(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. id=" + postId));

        if (Boolean.TRUE.equals(post.getDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글의 댓글은 조회할 수 없습니다. id=" + postId);
        }

        return commentRepository.findByPostIdAndDeletedFalseOrderByIdAsc(postId)
                .stream()
                .map(CommentResponseDto::new)
                .toList();
    }

    public List<CommentResponseDto> getCommentsByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다. id=" + userId));

        return commentRepository.findByUser_IdAndDeletedFalseOrderByIdDesc(userId)
                .stream()
                .map(CommentResponseDto::new)
                .toList();
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, String role) {
        if (userId == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. id=" + commentId));

        if (Boolean.TRUE.equals(comment.getDeleted())) {
            throw new IllegalArgumentException("이미 삭제된 댓글입니다. id=" + commentId);
        }

        boolean isOwner = comment.getUser().getId().equals(userId);
        boolean isAdmin = isAdminRole(role);

        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("본인 또는 관리자만 댓글을 삭제할 수 있습니다.");
        }

        comment.delete();
        comment.getPost().decreaseCommentCount();
    }

    @Transactional
    public CommentResponseDto updateComment(Long commentId, CommentUpdateRequestDto request) {
        validateUpdateRequest(request);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. id=" + commentId));

        if (Boolean.TRUE.equals(comment.getDeleted())) {
            throw new IllegalArgumentException("삭제된 댓글은 수정할 수 없습니다. id=" + commentId);
        }

        boolean isOwner = request.getUserId() != null && comment.getUser().getId().equals(request.getUserId());
        boolean isAdmin = isAdminRole(request.getRole());

        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("본인 또는 관리자만 댓글을 수정할 수 있습니다.");
        }

        comment.update(normalizeText(request.getContent()));

        return new CommentResponseDto(comment);
    }

    private void validateCreateRequest(CommentCreateRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("댓글 요청 정보가 없습니다.");
        }

        if (request.getPostId() == null) {
            throw new IllegalArgumentException("게시글 정보가 올바르지 않습니다.");
        }

        if (request.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        validateContent(request.getContent());
    }

    private void validateUpdateRequest(CommentUpdateRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("댓글 수정 요청 정보가 없습니다.");
        }

        if (request.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        validateContent(request.getContent());
    }

    private void validateContent(String content) {
        String normalizedContent = normalizeText(content);

        if (normalizedContent.isEmpty()) {
            throw new IllegalArgumentException("댓글 내용을 입력하세요.");
        }
    }

    private String normalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    private boolean isAdminRole(String role) {
        return role != null && "ADMIN".equalsIgnoreCase(role.trim());
    }
}