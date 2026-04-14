package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideAcceptedPassengerDTO {
    private Long passengerRideRequestId;
    private String passengerName;
    private String passengerEmail;
    private String passengerPhone;
    private String passengerPickupLocation;
    private String passengerDropLocation;
    private Integer numberOfSeats;
    private String passengerGender;
    private String rideRequestStatus;
    private String passengerProfilePicture;
    private LocalDateTime rideDepartureTime;
    public RideAcceptedPassengerDTO(
            Long passengerRideRequestId,
            String passengerName,
            String passengerEmail,
            String passengerPhone,
            String passengerPickupLocation,
            String passengerDropLocation,
            Integer numberOfSeats,
            String passengerGender,
            RideRequestStatus rideRequestStatus,
            String passengerProfilePicture,
            LocalDateTime rideDepartureTime) {
        this.passengerRideRequestId = passengerRideRequestId;
        this.passengerName = passengerName;
        this.passengerEmail = passengerEmail;
        this.passengerPhone = passengerPhone;
        this.passengerPickupLocation = passengerPickupLocation;
        this.passengerDropLocation = passengerDropLocation;
        this.numberOfSeats = numberOfSeats;
        this.passengerGender = passengerGender;
        this.rideRequestStatus = rideRequestStatus.name();
        this.passengerProfilePicture = passengerProfilePicture;
        this.rideDepartureTime = rideDepartureTime;
    }
}
