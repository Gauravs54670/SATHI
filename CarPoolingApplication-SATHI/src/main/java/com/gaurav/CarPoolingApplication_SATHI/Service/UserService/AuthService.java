package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

public interface AuthService {
    String requestOtp(String email);
    String resetPassword(String email, String otp, String newPassword);
}
