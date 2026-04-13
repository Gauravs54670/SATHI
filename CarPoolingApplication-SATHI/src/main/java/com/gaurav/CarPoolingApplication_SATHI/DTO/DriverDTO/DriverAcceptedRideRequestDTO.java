package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class DriverAcceptedRideRequestDTO {
    private Long rideId;
    private Long rideRequestId;
    private String passengerName;
    private String passengerContact;
    private String boardingAddress;
    private String destinationAddress;
    private Integer requestedSeats;
    private String rideRequestStatus;
    public DriverAcceptedRideRequestDTO(
        Long rideId,
        Long rideRequestId,
        String passengerName,
        String passengerContact,
        String boardingAddress,
        String destinationAddress,
        Integer requestedSeats,
        RideRequestStatus rideRequestStatus) {
        this.rideId = rideId;
        this.rideRequestId = rideRequestId;
        this.passengerName = passengerName;
        this.passengerContact = passengerContact;
        this.boardingAddress = boardingAddress;
        this.destinationAddress = destinationAddress;
        this.requestedSeats = requestedSeats;
        this.rideRequestStatus = rideRequestStatus.name();
    }
}
