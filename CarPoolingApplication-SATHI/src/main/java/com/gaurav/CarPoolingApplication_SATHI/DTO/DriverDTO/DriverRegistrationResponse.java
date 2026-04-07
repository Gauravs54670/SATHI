package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverVerificationStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;

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
public class DriverRegistrationResponse {
    private String licenseNumber;
    private LocalDate licenseExpirationDate;
    private String vehicleModel;
    private String vehicleNumber;
    private Integer vehicleSetCapacity;
    private VehicleCategory vehicleCategory;
    private VehicleClass vehicleClass;
    private DriverAvailabilityStatus driverAvailabilityStatus;
    private DriverVerificationStatus driverVerificationStatus;
    private Integer totalCompletedRides;
    private Integer totalCancelledRides;
    private LocalDateTime registeredAt;
}
