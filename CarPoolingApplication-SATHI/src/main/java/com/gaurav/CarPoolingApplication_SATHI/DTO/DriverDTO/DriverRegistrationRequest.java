package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDate;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Getter 
@Setter
public class DriverRegistrationRequest {
    @NotBlank(message = "License number is required")
    private String licenseNumber;
    @NotNull(message = "License expiration date is required")
    @Future(message = "License expiration date must be in the future")
    private LocalDate licenseExpirationDate;
    @NotBlank(message = "Vehicle model is required")
    private String vehicleModel;
    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;
    @NotNull(message = "Vehicle capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 20, message = "Capacity cannot exceed 20")
    private Integer vehicleSeatCapacity;
    @NotBlank(message = "Vehicle category is required")
    private String vehicleCategory;
    @NotBlank(message = "Vehicle class is required")
    private String vehicleClass;
}
