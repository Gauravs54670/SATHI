package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class RideAcceptedDriverDTO {
    private Long rideRequestId;
    private Long rideId;
    private String driverName;
    private String driverPhoneNumber;
    private String driverProfileUrl;
    private String rideStatus;
    // Extra details for the passenger to see
    private String vehicleModel;
    private String vehicleNumber;
    private String sourceAddress;
    private String destinationAddress;
    private LocalDateTime rideDepartureTime;
    private BigDecimal estimatedFare;

    public RideAcceptedDriverDTO(
            Long rideRequestId,
            Long rideId,
            String driverName,
            String driverPhoneNumber,
            String driverProfileUrl,
            RideStatus rideStatus,
            String vehicleModel,
            String vehicleNumber,
            String sourceAddress,
            String destinationAddress,
            LocalDateTime rideDepartureTime,
            BigDecimal estimatedFare) {
        this.rideRequestId = rideRequestId;
        this.rideId = rideId;
        this.driverName = driverName;
        this.driverPhoneNumber = driverPhoneNumber;
        this.driverProfileUrl = driverProfileUrl;
        this.rideStatus = rideStatus.name();
        this.vehicleModel = vehicleModel;
        this.vehicleNumber = vehicleNumber;
        this.sourceAddress = sourceAddress;
        this.destinationAddress = destinationAddress;
        this.rideDepartureTime = rideDepartureTime;
        this.estimatedFare = estimatedFare;
    }
}
