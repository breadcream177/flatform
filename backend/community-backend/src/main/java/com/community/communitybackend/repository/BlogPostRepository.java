package com.community.communitybackend.repository;

import java.util.List;
import com.community.communitybackend.entity.BlogPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findAllByOrderByCreatedAtDesc();

    List<BlogPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
