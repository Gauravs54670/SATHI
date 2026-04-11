package com.gaurav.CarPoolingApplication_SATHI.Exception;

public class TooManyRequestException extends RuntimeException {
    public TooManyRequestException(String message) {
        super(message);
    }
}
