package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService.PassengerService;

@RestController
@RequestMapping("/passenger")
public class PassengerController {
    private final PassengerService passengerService;
    public PassengerController(PassengerService passengerService) {
        this.passengerService = passengerService;
    }
    @GetMapping("/available-rides")
    public ResponseEntity<?> getAvailableRides(
            Authentication authentication,
            @RequestParam(required = false) String city) {
        String email = authentication.getName();
        List<AvailablePostedRideDTO> availableRides = this.passengerService.getAvailableRides(email, city);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Available rides fetched successfully",
            "data", availableRides
        ), HttpStatus.OK);
    }

}
