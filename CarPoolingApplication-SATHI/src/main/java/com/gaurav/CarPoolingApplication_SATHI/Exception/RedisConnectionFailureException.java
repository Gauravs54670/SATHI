package com.gaurav.CarPoolingApplication_SATHI.Exception;

public class RedisConnectionFailureException extends RuntimeException {
    public RedisConnectionFailureException(String message) {
        super(message);
    }
}
