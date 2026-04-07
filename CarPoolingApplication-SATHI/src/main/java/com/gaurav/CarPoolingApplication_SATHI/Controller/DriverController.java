package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.Service.DriverService.DriverService;

@RestController
@RequestMapping("/driver")
public class DriverController {
    private final DriverService driverService;
    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }
    // get `driver profile
    @GetMapping("/myProfile")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        DriverProfileDTO driverProfile = this.driverService.getDriverProfile(email);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Driver profile fetched successfully",
            "data", driverProfile
        ), HttpStatus.OK);
    }
}
