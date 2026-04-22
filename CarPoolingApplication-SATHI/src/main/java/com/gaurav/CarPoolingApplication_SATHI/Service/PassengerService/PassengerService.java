package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;

import java.util.List;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.PassengerRideReceiptDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideAcceptedDriverDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideSharingRequestToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideSharingResponseToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.PassengerRideHistoryDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRateRequestDTO;

public interface PassengerService {
    List<AvailablePostedRideDTO> getAvailableRides(String email, String city, Double sLat, Double sLng, Double dLat, Double dLng);
    RideSharingResponseToPostedRide requestRide(String email, RideSharingRequestToPostedRide rideSharingRequestToPostedRide);   
    List<RideRequestUpdatesDTO> getRideRequestUpdates(String email);
    void cancelRideRequest(String email, Long rideRequestId);
    List<RideAcceptedDriverDTO> getRideAcceptedDrivers(String email, Long rideRequestId);
    String getOtp(String email, Long rideRequestId);
    PassengerRideReceiptDTO getRideReceipt(String email, Long rideRequestId);
    String rateDriver(String email, UserRateRequestDTO userRateRequestDTO);
    List<PassengerRideHistoryDTO> getPassengerRideHistory(String email);
}
