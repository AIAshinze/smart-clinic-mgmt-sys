package com.project.back_end.services;

import org.springframework.http.HttpStatus;

public class ClinicException extends RuntimeException {

    private final HttpStatus status;

    public ClinicException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
