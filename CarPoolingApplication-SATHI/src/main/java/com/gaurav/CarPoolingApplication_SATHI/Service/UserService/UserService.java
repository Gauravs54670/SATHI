package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;

import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverRegistrationResponse;
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
    Set<UserRole> getUserRoles(String email);
    String verifyEmail(String email, String otp);
    DriverRegistrationResponse registerDriver(String email,DriverRegistrationRequest request);
}
