package com.community.communitybackend.repository;

import com.community.communitybackend.entity.Todo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findByUser_IdOrderByCreatedAtDesc(Long userId);
}