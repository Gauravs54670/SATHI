package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class RideJoinedPassengersDTO {
    private Long rideId;
    private Long rideRequestId;
    private String passengerName;
    private Integer requestedSeats;
    private String sourceLocation;
    private String destinationLocation;
    private Boolean isRated;
    public RideJoinedPassengersDTO(
            Long rideId,
            Long rideRequestId, String passengerName,
            Integer requestedSeats, String sourceLocation,
            String destinationLocation, Boolean isRated) {
        this.rideId = rideId;
        this.rideRequestId = rideRequestId;
        this.passengerName = passengerName;
        this.requestedSeats = requestedSeats;
        this.sourceLocation = sourceLocation;
        this.destinationLocation = destinationLocation;
        this.isRated = isRated;
    }
}
