package com.community.communitybackend.service;

import com.community.communitybackend.dto.BoardResponseDto;
import com.community.communitybackend.entity.Board;
import com.community.communitybackend.repository.BoardRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BoardService {

    private final BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }

    public List<BoardResponseDto> getBoards() {
        return boardRepository.findAllByOrderBySortOrderAscIdAsc()
                .stream()
                .map(BoardResponseDto::new)
                .toList();
    }

    public BoardResponseDto getBoardById(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시판을 찾을 수 없습니다. id=" + boardId));

        return new BoardResponseDto(board);
    }
}