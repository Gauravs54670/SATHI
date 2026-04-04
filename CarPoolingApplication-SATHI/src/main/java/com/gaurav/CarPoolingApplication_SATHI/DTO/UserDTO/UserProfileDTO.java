package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.io.Serializable;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@NoArgsConstructor
@Getter
@Setter
public class UserProfileDTO implements Serializable {
    private Long userId;
    private String userFullName;
    private String email;
    private String phoneNumber;
    private String userAccountStatus;
    private LocalDateTime accountCratedAt;
    private LocalDateTime accountUpdatedAt;
    private String profilePictureUrl;
    public UserProfileDTO(
        Long userId, String userFullName, 
        String email, String phoneNumber, 
        UserAccountStatus userAccountStatus, 
        LocalDateTime accountCratedAt, LocalDateTime accountUpdatedAt,
        String profilePictureUrl) {
        this.userId = userId;
        this.userFullName = userFullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.userAccountStatus = userAccountStatus.name();
        this.accountCratedAt = accountCratedAt;
        this.accountUpdatedAt = accountUpdatedAt;
        this.profilePictureUrl = profilePictureUrl;
    }
}
