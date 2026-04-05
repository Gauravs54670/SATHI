package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

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
    private String gender;
    private String bio;
    private Double averageRating;
    private Integer totalRatingsCount;
    private Integer totalRidesCompleted;
    private List<EmergencyContactDTO> emergencyContacts;
    public UserProfileDTO(
        Long userId, String userFullName,
        String email, String phoneNumber,
        UserAccountStatus userAccountStatus,
        LocalDateTime accountCratedAt,
        String profilePictureUrl,
        String gender,
        String bio,
        Double averageRating,
        Integer totalRatingsCount,
        Integer totalRidesCompleted){
        this.userId = userId;
        this.userFullName = userFullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.userAccountStatus = userAccountStatus.name();
        this.accountCratedAt = accountCratedAt;
        this.profilePictureUrl = profilePictureUrl;
        this.gender = gender;
        this.bio = bio;
        this.averageRating = averageRating;
        this.totalRatingsCount = totalRatingsCount;
        this.totalRidesCompleted = totalRidesCompleted;
    }
}
