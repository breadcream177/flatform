package com.community.communitybackend.repository;

import com.community.communitybackend.entity.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByDeletedFalseOrderByIdDesc();

    List<Post> findByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findByBoardIdAndDeletedFalseOrderByIdDesc(Long boardId);

    List<Post> findByUserIdAndDeletedFalseOrderByIdDesc(Long userId);

    @Query("""
        SELECT p
        FROM Post p
        WHERE p.deleted = false
          AND (p.title LIKE CONCAT('%', :keyword, '%')
               OR p.content LIKE CONCAT('%', :keyword, '%'))
        ORDER BY p.createdAt DESC
    """)
    List<Post> searchPosts(@Param("keyword") String keyword);

    @Query("""
        SELECT p
        FROM Post p
        WHERE p.deleted = false
          AND (p.title LIKE CONCAT('%', :keyword, '%')
               OR p.content LIKE CONCAT('%', :keyword, '%'))
        ORDER BY
          CASE WHEN p.title LIKE CONCAT('%', :keyword, '%') THEN 0 ELSE 1 END,
          p.createdAt DESC
    """)
    List<Post> searchPostsByRelevance(@Param("keyword") String keyword);
}
