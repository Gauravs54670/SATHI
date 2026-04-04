package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.time.LocalDateTime;
import java.util.Set;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class UserRegistrationResponse {
    private Long userId;
    private String userFullName;
    private String email;
    private String phoneNumber;
    private String gender;
    private UserAccountStatus accountStatus;
    private Set<UserRole> userRoles;
    private LocalDateTime accountCreatedAt;
    private String message;
}
