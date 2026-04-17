package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;

import java.util.List;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideAcceptedDriverDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingRequestToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingResponseToPostedRide;

public interface PassengerService {
    List<AvailablePostedRideDTO> getAvailableRides(String email, String city, Double sLat, Double sLng, Double dLat, Double dLng);
    RideSharingResponseToPostedRide requestRide(String email, RideSharingRequestToPostedRide rideSharingRequestToPostedRide);   
    List<RideRequestUpdatesDTO> getRideRequestUpdates(String email);
    void cancelRideRequest(String email, Long rideRequestId);
    List<RideAcceptedDriverDTO> getRideAcceptedDrivers(String email, Long rideRequestId);
    String getOtp(String email, Long rideRequestId);
}
