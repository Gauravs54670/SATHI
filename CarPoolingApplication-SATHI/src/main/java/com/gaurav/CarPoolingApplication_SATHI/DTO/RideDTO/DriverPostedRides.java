package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// used for queing the driver's posted rides based on current or future time stamps
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class DriverPostedRides {
    private Long rideId;
    private String sourceAddress;
    private String destinationAddress;
    private LocalDateTime rideDepartureTime;
    private LocalDateTime rideCreatedAt;
    private String rideStatus;
    private BigDecimal estimatedDistanceOfRide;
    private BigDecimal baseFare;
    private BigDecimal pricePerKm;
    private BigDecimal estimatedFare;
    private Integer availableSeats;
    private Integer totalSeats;
    public DriverPostedRides(
            Long rideId,
            String sourceAddress,
            String destinationAddress,
            LocalDateTime rideDepartureTime,
            LocalDateTime rideCreatedAt,
            RideStatus rideStatus,
            BigDecimal estimatedDistanceOfRide,
            BigDecimal baseFare,
            BigDecimal pricePerKm,
            BigDecimal estimatedFare,
            Integer availableSeats,
            Integer totalSeats) {
        this.rideId = rideId;
        this.sourceAddress = sourceAddress;
        this.destinationAddress = destinationAddress;
        this.rideDepartureTime = rideDepartureTime;
        this.rideCreatedAt = rideCreatedAt;
        this.rideStatus = rideStatus.name();
        this.estimatedDistanceOfRide = estimatedDistanceOfRide;
        this.baseFare = baseFare;
        this.pricePerKm = pricePerKm;
        this.estimatedFare = estimatedFare;
        this.availableSeats = availableSeats;
        this.totalSeats = totalSeats;
    }
}
