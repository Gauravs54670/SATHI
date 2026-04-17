package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAcceptedPassengerDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAllBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.DriverPostedRides;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideGPSUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RidePostResponseDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.Service.DriverService.DriverService;

import jakarta.validation.Valid;

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
    // update driver profile
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @RequestBody UpdateDriverProfileRequest request) {
        String email = authentication.getName();
        DriverProfileDTO driverProfile = this.driverService.updateDriverProfile(email, request);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Driver profile updated successfully",
            "data", driverProfile
        ), HttpStatus.OK);
    }
    // change driver availability status
    @PutMapping("/change-availability-status")
    public ResponseEntity<?> changeDriverAvailabilityStatus(
        Authentication authentication, @RequestParam("status") String driverAvailabilityStatus) {
        String email = authentication.getName();
        String message = this.driverService.changeDriverAvailabilityStatus(email, driverAvailabilityStatus);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", message
        ), HttpStatus.OK);
    }
    // post ride
    @PostMapping("/post-ride")
    public ResponseEntity<?> postRide(Authentication authentication, @Valid @RequestBody RideRequestDTO rideRequestDTO) {
        String email = authentication.getName();
        RidePostResponseDTO response = this.driverService.postRide(email, rideRequestDTO);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride request submitted successfully."
            + " Please wait for user confirmation.",
            "data", response
        ), HttpStatus.OK);
    }
    // get active ride posted by driver
    @GetMapping("/active-ride")
    public ResponseEntity<?> getActiveRide(Authentication authentication) {
        String email = authentication.getName();
        List<DriverPostedRides> activeRide = this.driverService.getActiveRideForDriver(email);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Active ride(s) found",
            "data", activeRide
        ), HttpStatus.OK);
    }
    // check if driver has any active ride
    @GetMapping("/has-active-ride")
    public ResponseEntity<?> hasActiveRide(Authentication authentication) {
        String email = authentication.getName();
        Boolean hasActiveRide = this.driverService.hasActiveRide(email);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Active ride presence checked successfully",
            "data", hasActiveRide
        ), HttpStatus.OK);
    }
    // get ride requests for active ride
    @GetMapping("/ride-requests")
    public ResponseEntity<?> getRideRequests(Authentication authentication, 
            @RequestParam("rideId") Long rideId) {
        String email = authentication.getName();
        RideAllBookingRequestsDTO rideRequests = this.driverService
            .getMyPostedRidesRequests(email, rideId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride requests fetched successfully",
            "data", rideRequests
        ), HttpStatus.OK);
    }
    // accept ride request
    @PutMapping("/accept-ride-request")
    public ResponseEntity<?> acceptRideRequest(Authentication authentication, 
            @RequestParam("rideId") Long rideId, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        String message = this.driverService.acceptRideRequest(email, rideId, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", message
        ), HttpStatus.OK);
    }
    // reject ride request
    @PutMapping("/reject-ride-request")
    public ResponseEntity<?> rejectRideRequest(Authentication authentication, 
            @RequestParam("rideId") Long rideId, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        String message = this.driverService.rejectRideRequest(email, rideId, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", message
        ), HttpStatus.OK);
    }
    // get ride accepted passengers
    @GetMapping("/ride-accepted-passengers")
    public ResponseEntity<?> getRideAcceptedPassengers(Authentication authentication, 
            @RequestParam("rideId") Long rideId) {
        String email = authentication.getName();
        List<RideAcceptedPassengerDTO> rideAcceptedPassengerDTOs = this.driverService
            .getRideAcceptedPassengers(email, rideId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride accepted passengers fetched successfully",
            "data", rideAcceptedPassengerDTOs
        ), HttpStatus.OK);
    }
    // start ride
    @PutMapping("/start-ride")
    public ResponseEntity<?> startRide(Authentication authentication, @RequestParam("rideId") Long rideId) {
        String email = authentication.getName();
        this.driverService.startRide(email, rideId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride started successfully. Passengers have been notified."
        ), HttpStatus.OK);
    }

    // ride live updates
    @PostMapping("/update-ride-gps")
    public ResponseEntity<?> updateRideGPS(Authentication authentication, 
            @RequestBody RideGPSUpdatesDTO rideGPSUpdatesDTO) {
        String email = authentication.getName();
        this.driverService.updateRideGPS(email, rideGPSUpdatesDTO);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Ride GPS updated successfully"
        ), HttpStatus.OK);
    }

    // reached passenger pickup point
    @PutMapping("/reached-passenger")
    public ResponseEntity<?> reachedPassengerPickUp(Authentication authentication, 
            @RequestParam("rideId") Long rideId, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        this.driverService.reachedPassengerPickUp(email, rideId, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Assistant: Arrival marked. OTP sent to passenger successfully."
        ), HttpStatus.OK);
    }

    // verify passenger otp
    @PutMapping("/verify-otp")
    public ResponseEntity<?> verifyPassengerOtp(
            @RequestParam("rideId") Long rideId, 
            @RequestParam("rideRequestId") Long rideRequestId,
            @RequestParam("otp") String otp) {
        this.driverService.verifyOtp(rideId, rideRequestId, otp);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Passenger boarded successfully."
        ), HttpStatus.OK);
    }

    // cancel pickup
    @PutMapping("/cancel-pickup")
    public ResponseEntity<?> cancelPickup(Authentication authentication,
            @RequestParam("rideId") Long rideId, @RequestParam("rideRequestId") Long rideRequestId) {
        String email = authentication.getName();
        this.driverService.cancelPickup(email, rideId, rideRequestId);
        return new ResponseEntity<>(Map.of(
            "status", "success",
            "message", "Pickup cancelled. Seat inventory restored."
        ), HttpStatus.OK);
    }
}
