package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;

import java.util.List;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;

public interface PassengerService {
    List<AvailablePostedRideDTO> getAvailableRides(String email, String city);
}
