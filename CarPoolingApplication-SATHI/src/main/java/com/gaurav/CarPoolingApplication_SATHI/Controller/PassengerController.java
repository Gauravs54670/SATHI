package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.PassengerRideReceiptDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideAcceptedDriverDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideSharingRequestToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideSharingResponseToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRateRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService.PassengerService;

import jakarta.validation.Valid;

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
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double sLat,
            @RequestParam(required = false) Double sLng,
            @RequestParam(required = false) Double dLat,
            @RequestParam(required = false) Double dLng) {
        String email = authentication.getName();
        List<AvailablePostedRideDTO> availableRides = this.passengerService.getAvailableRides(email, city, sLat, sLng, dLat, dLng);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Available rides fetched successfully",
            "data", availableRides
        ), HttpStatus.OK);
    }
    @PostMapping("/request-ride")
    public ResponseEntity<?> requestRide(
            Authentication authentication,
            @RequestBody RideSharingRequestToPostedRide rideSharingRequestToPostedRide) {
        String email = authentication.getName();
        RideSharingResponseToPostedRide rideSharingResponseToPostedRide = this.passengerService.requestRide(email, rideSharingRequestToPostedRide);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride requested successfully",
            "data", rideSharingResponseToPostedRide
        ), HttpStatus.OK);
    }
    @GetMapping("/ride-request-updates")
    public ResponseEntity<?> getRideRequestUpdates(Authentication authentication) {
        String email = authentication.getName();
        List<RideRequestUpdatesDTO> rideRequestUpdates = this.passengerService.getRideRequestUpdates(email);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride request updates fetched successfully",
            "data", rideRequestUpdates
        ), HttpStatus.OK);
    }
    @PostMapping("/cancel-ride-request")
    public ResponseEntity<?> cancelRideRequest(
            Authentication authentication,
            @RequestParam Long rideRequestId) {
        String email = authentication.getName();
        this.passengerService.cancelRideRequest(email, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride request cancelled successfully"
        ), HttpStatus.OK);
    }
    @GetMapping("/ride-accepted-drivers")
    public ResponseEntity<?> getRideAcceptedDrivers(Authentication authentication,
            @RequestParam("requestId") Long rideRequestId) {
        String email = authentication.getName();
        List<RideAcceptedDriverDTO> drivers = this.passengerService.getRideAcceptedDrivers(email, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Accepted driver details fetched successfully",
            "data", drivers
        ), HttpStatus.OK);
    }

    @GetMapping("/get-otp")
    public ResponseEntity<?> getOtp(Authentication authentication, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        String otp = this.passengerService.getOtp(email, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "OTP fetched successfully",
            "data", otp
        ), HttpStatus.OK);
    }

    @GetMapping("/ride-receipt")
    public ResponseEntity<?> getRideReceipt(Authentication authentication, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        PassengerRideReceiptDTO receipt = this.passengerService.getRideReceipt(email, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride receipt fetched successfully",
            "data", receipt
        ), HttpStatus.OK);
    }

    @PostMapping("/rate-driver")
    public ResponseEntity<?> rateDriver(
            Authentication authentication,
            @Valid @RequestBody UserRateRequestDTO userRateRequestDTO) {
        String email = authentication.getName();
        String message = this.passengerService.rateDriver(email, userRateRequestDTO);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", message
        ), HttpStatus.OK);
    }
}
