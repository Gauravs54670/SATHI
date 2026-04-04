package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;

import org.springframework.web.multipart.MultipartFile;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;

public interface UserService {
    UserRegistrationResponse registerUser(UserRegistrationRequest request);
    UserProfileDTO getUserProfileByEmail(String email);
    String uploadProfile(String email, MultipartFile file);
}
