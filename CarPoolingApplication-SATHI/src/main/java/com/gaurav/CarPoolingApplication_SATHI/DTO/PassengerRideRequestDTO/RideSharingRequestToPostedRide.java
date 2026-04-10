package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter 
@Setter
@Builder
public class RideSharingRequestToPostedRide {
    private Long rideId;
    private Double passengerSourceLng;
    private Double passengerSourceLat;
    private String passengerSourceLocation;
    private Double passengerDestinationLng;
    private Double passengerDestinationLat;
    private String passengerDestinationAddress;
    private Integer seatsRequired;
}
