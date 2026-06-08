package com.community.communitybackend.exception;

import org.springframework.http.HttpStatus;

public class AiSearchException extends RuntimeException {

    private final HttpStatus status;

    public AiSearchException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

