package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;
import java.util.List;

import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.*;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAcceptedPassengerDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAllBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRateRequestDTO;
@Service
public interface DriverService {
    DriverProfileDTO getDriverProfile(String email);
    DriverProfileDTO updateDriverProfile(String email, UpdateDriverProfileRequest request);
    String changeDriverAvailabilityStatus(String email, String driverAvailabilityStatus);
    RidePostResponseDTO postRide(String email, RideRequestDTO rideRequestDTO);
    List<DriverPostedRides> getActiveRideForDriver(String email);
    Boolean hasActiveRide(String email);
    RideAllBookingRequestsDTO getMyPostedRidesRequests(String email, Long rideId);
    String acceptRideRequest(String email,Long rideId, Long rideRequestId);
    String rejectRideRequest(String email,Long rideId, Long rideRequestId);
    List<RideAcceptedPassengerDTO> getRideAcceptedPassengers(String email, Long rideId);
    void startRide(String email, Long rideId);
    void cancelRide(String email, Long rideId);
    void updateRideGPS(String email, RideGPSUpdatesDTO rideGPSUpdatesDTO);
    void reachedPassengerPickUp(String email, Long rideId, Long rideReqeustId);
    void verifyOtp(Long rideId, Long rideRequestId, String otp);
    void cancelPickup(String email, Long rideId, Long rideRequestId);
    RideCompletedDTO completeRide(String email, Long rideId);
    String ratePassenger(String email, UserRateRequestDTO userRateRequestDTO);
    List<DriverRideHistoryDTO> driverRideHistoryDTO(String email);
}
