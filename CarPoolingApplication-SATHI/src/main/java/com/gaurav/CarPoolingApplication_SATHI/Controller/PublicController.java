package com.gaurav.CarPoolingApplication_SATHI.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.Map;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.Service.UserService.UserService;

@RestController
@RequestMapping("/public")
public class PublicController {
    private final UserService userService;
    public PublicController(UserService userService) {
        this.userService = userService;
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest userRegistrationRequest) {
        UserRegistrationResponse registrationResponse = this.userService.registerUser(userRegistrationRequest);
        return new ResponseEntity<>(Map.of(
            "message",registrationResponse.getMessage(),
            "user",registrationResponse
            ),HttpStatus.OK);
    }
}
