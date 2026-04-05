package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.Service.UserService.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestParam("email") String email) {
        String message = this.authService.requestOtp(email);
        return new ResponseEntity<>(Map.of(
                "message", message
        ), HttpStatus.OK);
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam("email") String email, 
            @RequestParam("otp") String otp, 
            @RequestParam("newPassword") String newPassword) {
        String message = this.authService.resetPassword(email, otp, newPassword);
        return new ResponseEntity<>(Map.of(
                "message", message
        ), HttpStatus.OK);
    }
}
