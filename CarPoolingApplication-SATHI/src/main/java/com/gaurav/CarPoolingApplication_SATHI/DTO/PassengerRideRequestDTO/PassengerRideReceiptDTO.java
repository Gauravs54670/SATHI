package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PassengerRideReceiptDTO {
    private Long rideRequestId;
    private Long rideId;
    private String driverName;
    private String driverPhoneNumber;
    private String driverProfilePictureUrl;
    private String vehicleModel;
    private String vehicleNumber;
    private String sourceLocation;
    private String destinationLocation;
    private LocalDateTime departureTime;
    private LocalDateTime completionTime;
    private String rideStatus;
    private BigDecimal fullJourneyFare;
    private BigDecimal estimatedFareAtRequest;
    private BigDecimal finalFarePaid;
    private Integer totalSeatsOffered;
    private Integer requestedSeats;
    private BigDecimal billingDistance;
    public PassengerRideReceiptDTO(
        Long rideRequestId, Long rideId,
        String driverName, String driverPhoneNumber, String driverProfilePictureUrl,
        String vehicleModel, String vehicleNumber,
        String sourceLocation, String destinationLocation,
        LocalDateTime departureTime, LocalDateTime completionTime,
        RideStatus rideStatus,
        BigDecimal fullJourneyFare, BigDecimal estimatedFareAtRequest,
        BigDecimal finalFarePaid,
        Integer totalSeatsOffered, Integer requestedSeats,
        BigDecimal billingDistance
    ) {
        this.rideRequestId = rideRequestId;
        this.rideId = rideId;
        this.driverName = driverName;
        this.driverPhoneNumber = driverPhoneNumber;
        this.driverProfilePictureUrl = driverProfilePictureUrl;
        this.vehicleModel = vehicleModel;
        this.vehicleNumber = vehicleNumber;
        this.sourceLocation = sourceLocation;
        this.destinationLocation = destinationLocation;
        this.departureTime = departureTime;
        this.completionTime = completionTime;
        this.rideStatus = rideStatus.name();
        this.fullJourneyFare = fullJourneyFare;
        this.estimatedFareAtRequest = estimatedFareAtRequest;
        this.finalFarePaid = finalFarePaid;
        this.totalSeatsOffered = totalSeatsOffered;
        this.requestedSeats = requestedSeats;
        this.billingDistance = billingDistance;
    }
}
