package com.gaurav.CarPoolingApplication_SATHI.Exception;

public class NoActiveRideFoundException extends RuntimeException {
    public NoActiveRideFoundException(String message) {
        super(message);
    }
}
