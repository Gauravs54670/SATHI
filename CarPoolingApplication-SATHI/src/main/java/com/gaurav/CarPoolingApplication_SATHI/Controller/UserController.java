package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.ChangePasswordRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileUpdateRequest;
import com.gaurav.CarPoolingApplication_SATHI.Service.UserService.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/user")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }
    //    get user's profile
    @GetMapping("/myProfile")
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserProfileDTO profileDTO = this.userService.getUserProfileByEmail(email);
        return new ResponseEntity<>(Map.of(
                "message", "Profile fetched successfully",
                "response", profileDTO
        ), HttpStatus.OK);
    }  
    @PostMapping("/uploadProfile")
    public ResponseEntity<?> uploadProfile(@RequestParam("file") MultipartFile file, Authentication authentication) {
        String email = authentication.getName();
        String profileUrl = this.userService.uploadProfilePhoto(email, file);
        return new ResponseEntity<>(Map.of(
                "message", "Profile photo uploaded successfully",
                "response", profileUrl
        ), HttpStatus.OK);
    } 
    @PostMapping("/update-myProfile")
    public ResponseEntity<?> updateMyProfile(
        Authentication authentication,
         @Valid @RequestBody UserProfileUpdateRequest userProfileUpdateRequest) {
            String email = authentication.getName();
            UserProfileDTO profileDTO = this.userService.updateProfile(email, userProfileUpdateRequest);
            return new ResponseEntity<>(Map.of(
                "message", "Profile updated successfully",
                "response", profileDTO
            ), HttpStatus.OK);
    }
    @DeleteMapping("/delete-emergencyContact")
    public ResponseEntity<?> deleteEmergencyContact(
        Authentication authentication,
        @RequestParam("contactId") Long contactId) {
        String email = authentication.getName();
        this.userService.deleteEmergencyContact(email, contactId);
        return new ResponseEntity<>(Map.of(
                "message", "Contact deleted successfully"
        ), HttpStatus.OK);
    }
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
        Authentication authentication,
        @Valid @RequestBody ChangePasswordRequest request) {
        String email = authentication.getName();
        this.userService.changeAccountPassword(email, request);
        return new ResponseEntity<>(Map.of(
                "message", "Password changed successfully"
        ), HttpStatus.OK);
    }
}
