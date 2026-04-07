package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Getter 
@Setter
public class UpdateDriverProfileRequest {
    private LocalDate licenseExpirationDate;
    private String vehicleModel;
    private String vehicleNumber;
    private Integer vehicleSeatCapacity;
    private String vehicleCategory;
    private String vehicleClass;
}
