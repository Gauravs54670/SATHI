package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserProfileDTO implements Serializable {
    private Long userId;
    private String userFullName;
    private String email;
    private String phoneNumber;
    private String userAccountStatus;
    private LocalDateTime accountCreatedAt;
    private LocalDateTime accountUpdatedAt;
    private String profilePictureUrl;
    private String gender;
    private String bio;
    private Double averageRating;
    private Integer totalRatingsCount;
    private Integer totalRidesCompleted;
    private List<EmergencyContactDTO> emergencyContacts;
    
    @Getter(onMethod_ = {@JsonProperty("isEmailVerified")})
    private boolean isEmailVerified;

    public UserProfileDTO(
        Long userId, String userFullName,
        String email, String phoneNumber,
        UserAccountStatus userAccountStatus,
        LocalDateTime accountCreatedAt,
        LocalDateTime accountUpdatedAt,
        String profilePictureUrl,
        String gender,
        String bio,
        Double averageRating,
        Integer totalRatingsCount,
        Integer totalRidesCompleted,
        boolean isEmailVerified){
        this.userId = userId;
        this.userFullName = userFullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.userAccountStatus = userAccountStatus.name();
        this.accountCreatedAt = accountCreatedAt;
        this.accountUpdatedAt = accountUpdatedAt;
        this.profilePictureUrl = profilePictureUrl;
        this.gender = gender;
        this.bio = bio;
        this.averageRating = averageRating;
        this.totalRatingsCount = totalRatingsCount;
        this.totalRidesCompleted = totalRidesCompleted;
        this.isEmailVerified = isEmailVerified;
    }
}
