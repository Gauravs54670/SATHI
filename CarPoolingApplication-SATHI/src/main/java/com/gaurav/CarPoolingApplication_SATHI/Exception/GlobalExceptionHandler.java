    package com.gaurav.CarPoolingApplication_SATHI.Exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DuplicateEntryException.class)
    public ResponseEntity<ExceptionDescription> handleDuplicateEntryException(DuplicateEntryException ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ExceptionDescription> handleUserNotFoundException(UserNotFoundException ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.NOT_FOUND);
    }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ExceptionDescription> handleAccessDeniedException(AccessDeniedException ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.FORBIDDEN);
    }
    @ExceptionHandler(RedisConnectionFailureException.class)
    public ResponseEntity<ExceptionDescription> handleRedisConnectionFailureException(RedisConnectionFailureException ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionDescription> handleException(Exception ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionDescription> handleIllegalArgumentException(IllegalArgumentException ex) {
        ExceptionDescription exceptionDescription = new ExceptionDescription(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                LocalDateTime.now());
        return new ResponseEntity<>(exceptionDescription, HttpStatus.BAD_REQUEST);
    }
}
