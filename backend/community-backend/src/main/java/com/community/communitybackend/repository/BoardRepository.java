package com.community.communitybackend.repository;

import com.community.communitybackend.entity.Board;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findAllByOrderBySortOrderAscIdAsc();

    List<Board> findByActiveTrueOrderBySortOrderAscIdAsc();

    Optional<Board> findByCode(String code);
}