package com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
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
@Entity
@Table(name = "user_entity")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    @Column(nullable = false)
    private String userFullName;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(unique = true, nullable = false, length = 15)
    private String phoneNumber;
    @Column(nullable = false)
    private String password;
    @Column(length = 500)
    private String profilePictureUrl;
    @Column(length = 10)
    private String gender;
    @Column(length = 300)
    private String bio;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserAccountStatus accountStatus;
    private Boolean isAdminSuspendedAccount = false;
    @Enumerated(EnumType.STRING)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "user_role", length = 20)
    private Set<UserRole> userRoles;
    private String otp;
    private LocalDateTime otpExpirationTime;
    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double averageRating = 0.0;
    private Integer totalRatingsCount = 0;
    private Integer totalRidesCompleted = 0;
    private String emergencyContactName;
    @Column(length = 15)
    private String emergencyContactPhone;
    private LocalDateTime accountCreatedAt;
    private LocalDateTime accountUpdatedAt;

    // Auto-set creation timestamp
    @PrePersist
    protected void onCreate() {
        this.accountCreatedAt = LocalDateTime.now();
        this.accountUpdatedAt = LocalDateTime.now();
    }

    // Auto-set update timestamp
    @PreUpdate
    protected void onUpdate() {
        this.accountUpdatedAt = LocalDateTime.now();
    }
}
