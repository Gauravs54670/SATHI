package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@NoArgsConstructor
@Getter 
@Setter
public class RideRequestUpdatesDTO {
    private Long rideId;
    private Long rideRequestedId;
    private String rideRequestStatus;
    private String message;
    private LocalDateTime requestedAt;
    private String driverName;
    private LocalDateTime rideDepartureTime;
    private String passengerSourceLocation;
    private String passengerDestinationLocation;
    private Integer requestedSeats;
    private BigDecimal estimatedFare;
    private String rideStatus;
    private Boolean isDriverReachedPickupLocation;
    private Integer rejectionCount;
    private Integer numberOfRequests;

    public RideRequestUpdatesDTO(
        Long rideId,
        Long rideRequestedId,
        RideRequestStatus rideRequestStatus,
        LocalDateTime requestedAt,
        String driverName,
        LocalDateTime rideDepartureTime,
        String passengerSourceLocation,
        String passengerDestinationLocation,
        Integer requestedSeats,
        BigDecimal estimatedFare,
        RideStatus rideStatus,
        Boolean isDriverReachedPickupLocation,
        Integer rejectionCount,
        Integer numberOfRequests) {
        this.rideId = rideId;
        this.rideRequestedId = rideRequestedId;
        this.rideRequestStatus = rideRequestStatus.name();
        this.requestedAt = requestedAt;
        this.driverName = driverName;
        this.rideDepartureTime = rideDepartureTime;
        this.passengerSourceLocation = passengerSourceLocation;
        this.passengerDestinationLocation = passengerDestinationLocation;
        this.requestedSeats = requestedSeats;
        this.estimatedFare = estimatedFare;
        this.rideStatus = rideStatus.name();
        this.isDriverReachedPickupLocation = isDriverReachedPickupLocation;
        this.rejectionCount = rejectionCount;
        this.numberOfRequests = numberOfRequests;
    }
}
