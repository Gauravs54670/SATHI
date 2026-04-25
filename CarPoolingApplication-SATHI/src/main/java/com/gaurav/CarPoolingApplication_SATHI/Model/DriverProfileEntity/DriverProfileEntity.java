package com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(name = "driver_profiles")
public class DriverProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long driverProfileId;
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Column(nullable = false, unique = true)
    private String licenseNumber;
    @Column(nullable = false)
    private LocalDate licenseExpirationDate;
    @Column(nullable = false)
    private String vehicleModel;
    @Column(nullable = false, unique = true)
    private String vehicleNumber;
    @Column(nullable = false)
    private Integer vehicleSeatCapacity;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VehicleCategory vehicleCategory;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VehicleClass vehicleClass;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DriverAvailabilityStatus driverAvailabilityStatus;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DriverVerificationStatus driverVerificationStatus;
    private Integer totalCompletedRides;
    private Integer totalCancelledRides;
    private BigDecimal totalEarnings;
    @Builder.Default
    private Boolean isAdminVerified = false;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
