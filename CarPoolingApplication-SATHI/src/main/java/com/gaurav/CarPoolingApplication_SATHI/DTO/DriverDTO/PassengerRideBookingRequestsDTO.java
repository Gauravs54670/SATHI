package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PassengerRideBookingRequestsDTO {
    private Long rideRequestId;
    private String passengerName;
    private String pickupLocation;
    private String dropLocation;
    private String rideRequestStatus;
    private Integer requestedSeats;
    private LocalDateTime requestedAt;
    public PassengerRideBookingRequestsDTO(
            Long rideRequestId, String passengerName, String pickupLocation,
            String dropLocation, RideRequestStatus rideRequestStatus, Integer requestedSeats,
            LocalDateTime requestedAt) {
        this.rideRequestId = rideRequestId;
        this.passengerName = passengerName;
        this.pickupLocation = pickupLocation;
        this.dropLocation = dropLocation;
        this.rideRequestStatus = rideRequestStatus.name();
        this.requestedSeats = requestedSeats;
        this.requestedAt = requestedAt;

    }
}

