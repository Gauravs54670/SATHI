package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class PassengerRideHistoryDTO {
    private Long rideId;
    private Long rideRequestId;
    private String driverName;
    private Integer requestedSeats;
    private String boardingLocation;
    private String dropOffLocation;
    private Boolean isRated;
    public PassengerRideHistoryDTO(
            Long rideId, Long rideRequestId,
            String driverName, Integer requestedSeats,
            String boardingLocation, String dropOffLocation, Boolean isRated) {
        this.rideId = rideId;
        this.rideRequestId = rideRequestId;
        this.driverName = driverName;
        this.requestedSeats = requestedSeats;
        this.boardingLocation = boardingLocation;
        this.dropOffLocation = dropOffLocation;
        this.isRated = isRated;
    }
}
