package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
@Service
public interface DriverService {
    DriverProfileDTO getDriverProfile(String email);
}
