package com.community.communitybackend.repository;

import com.community.communitybackend.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndDeletedFalseOrderByIdAsc(Long postId);

    List<Comment> findByIdAndDeletedFalse(Long commentId);

    List<Comment> findByUser_IdAndDeletedFalseOrderByIdDesc(Long userId);
}