package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO;

import java.time.LocalDateTime;

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
public class RideSharingResponseToPostedRide {
    private Long rideId;
    private Long rideRequestId;
    private String passengerName;
    private String passengerSourceAddress;
    private String passengerDestinationAddress;
    private String requestStatus;
    private Integer requestedSeats;
    private LocalDateTime requestedAt;
}
