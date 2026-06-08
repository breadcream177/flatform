package com.community.communitybackend.controller;

import com.community.communitybackend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/web")
    public String searchWeb(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int display,
            @RequestParam(defaultValue = "date") String sort
    ) {
        return searchService.searchWeb(keyword, page, display, sort);
    }

    @GetMapping("/news")
    public String searchNews(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int display,
            @RequestParam(defaultValue = "date") String sort
    ) {
        return searchService.searchNews(keyword, page, display, sort);
    }

    @GetMapping("/blog")
    public String searchBlog(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int display,
            @RequestParam(defaultValue = "date") String sort
    ) {
        return searchService.searchBlog(keyword, page, display, sort);
    }

    @GetMapping("/image")
    public String searchImage(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int display,
            @RequestParam(defaultValue = "sim") String sort
    ) {
        return searchService.searchImage(keyword, page, display, sort);
    }
}
