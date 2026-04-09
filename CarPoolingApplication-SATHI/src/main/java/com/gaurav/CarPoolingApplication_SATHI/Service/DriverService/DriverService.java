package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RidePostResponseDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideRequestDTO;
@Service
public interface DriverService {
    DriverProfileDTO getDriverProfile(String email);
    DriverProfileDTO updateDriverProfile(String email, UpdateDriverProfileRequest request);
    String changeDriverAvailabilityStatus(String email, String driverAvailabilityStatus);
    RidePostResponseDTO postRide(String email, RideRequestDTO rideRequestDTO);
}
