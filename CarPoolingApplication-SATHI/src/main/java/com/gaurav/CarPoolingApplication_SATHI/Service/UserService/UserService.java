package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;

import org.springframework.web.multipart.MultipartFile;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.ChangePasswordRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileUpdateRequest;

public interface UserService {
    UserRegistrationResponse registerUser(UserRegistrationRequest request);
    UserProfileDTO getUserProfileByEmail(String email);
    String uploadProfilePhoto(String email, MultipartFile file);
    UserProfileDTO updateProfile(String email, UserProfileUpdateRequest request);
    void deleteEmergencyContact(String email, Long contactId);
    void changeAccountPassword(String email, ChangePasswordRequest request);
    
}
