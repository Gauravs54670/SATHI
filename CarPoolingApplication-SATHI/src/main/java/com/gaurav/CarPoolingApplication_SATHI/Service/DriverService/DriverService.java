package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
@Service
public interface DriverService {
    DriverProfileDTO getDriverProfile(String email);
    DriverProfileDTO updateDriverProfile(String email, UpdateDriverProfileRequest request);
    String changeDriverAvailabilityStatus(String email, String driverAvailabilityStatus);
}
