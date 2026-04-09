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
    private RideStatus rideStatus;
    private BigDecimal estimatedDistanceOfRide;
    private BigDecimal baseFare;
    private BigDecimal pricePerKm;
    private BigDecimal estimatedFare;
}
