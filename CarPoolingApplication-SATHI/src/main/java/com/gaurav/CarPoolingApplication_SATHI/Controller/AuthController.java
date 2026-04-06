package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.Login;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.LoginResponse;
import com.gaurav.CarPoolingApplication_SATHI.JWT.JWTUtils;
import com.gaurav.CarPoolingApplication_SATHI.Service.UserService.AuthService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final JWTUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    public AuthController(
        AuthService authService,
        JWTUtils jwtUtils,
        AuthenticationManager authenticationManager){
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> signIn(@Valid @RequestBody Login login) { 
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(login.getEmail(), login.getPassword())
    );
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String jwtToken = this.jwtUtils.generateJwtToken(userDetails);
        return ResponseEntity.ok(new LoginResponse(jwtToken, "Login successful")); 
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
