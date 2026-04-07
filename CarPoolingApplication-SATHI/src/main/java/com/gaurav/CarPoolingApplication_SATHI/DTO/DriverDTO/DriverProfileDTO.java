package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverVerificationStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Getter 
@Setter
public class DriverProfileDTO {
    private Long driverProfileId;
    private String email;
    private String phoneNumber;
    private String userFullName;
    private String driverProfileUrl;
    private String driverLicenseNumber;
    private LocalDate licenseExpirationDate;
    private String vehicleModel;
    private String vehicleNumber;
    private Integer vehicleSeatCapacity;
    private String vehicleCategory;
    private String vehicleClass;
    private String driverVerificationStatus;
    private String driverAvailabilityStatus;
    private Integer totalCompletedRides;
    private Integer totalCancelledRides;
    private Double averageRating;
    private Integer totalRatingsCount;
    private LocalDateTime accountCreatedAt;
    public DriverProfileDTO(
        Long driverProfileId,
        String email,
        String phoneNumber,
        String userFullName,
        String driverProfileUrl,
        String driverLicenseNumber,
        LocalDate licenseExpirationDate,
        String vehicleModel,
        String vehicleNumber,
        Integer vehicleSeatCapacity,
        VehicleCategory vehicleCategory,
        VehicleClass vehicleClass,
        DriverVerificationStatus driverVerificationStatus,
        DriverAvailabilityStatus driverAvailabilityStatus,
        Integer totalCompletedRides,
        Integer totalCancelledRides,
        Double averageRating,
        Integer totalRatingsCount,
        LocalDateTime registeredAt){
        this.driverProfileId = driverProfileId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.userFullName = userFullName;
        this.driverProfileUrl = driverProfileUrl;
        this.driverLicenseNumber = driverLicenseNumber;
        this.licenseExpirationDate = licenseExpirationDate;
        this.vehicleModel = vehicleModel;
        this.vehicleNumber = vehicleNumber;
        this.vehicleSeatCapacity = vehicleSeatCapacity;
        this.vehicleCategory = vehicleCategory.name();
        this.vehicleClass = vehicleClass.name();
        this.driverVerificationStatus = driverVerificationStatus.name();
        this.driverAvailabilityStatus = driverAvailabilityStatus.name();
        this.totalCompletedRides = totalCompletedRides;
        this.totalCancelledRides = totalCancelledRides;
        this.averageRating = averageRating;
        this.totalRatingsCount = totalRatingsCount;
        this.accountCreatedAt = registeredAt;
    }
}
