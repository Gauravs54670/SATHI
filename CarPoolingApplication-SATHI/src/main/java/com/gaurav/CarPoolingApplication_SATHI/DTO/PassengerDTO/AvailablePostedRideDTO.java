package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@NoArgsConstructor
@Getter 
@Setter
public class AvailablePostedRideDTO {
    private Long rideId;
    private String driverName;
    private String driverEmail;
    private Double driverRating;
    private String driverSourceAddress;
    private String driverDestinationAddress;
    private LocalDateTime rideDepartureTime;
    private Integer totalAvailableSeats;
    private BigDecimal basePrice;
    private BigDecimal pricePerKm;
    private BigDecimal totalEstimatedCost;
    private BigDecimal totalDistance;
    private String vehicleModel;
    private String vehicleClass;
    private String vehicleCategory;
        public AvailablePostedRideDTO(
            Long rideId, 
            String driverName, 
            String driverEmail,
            Double driverRating, 
            String driverSourceAddress, 
            String driverDestinationAddress, 
            LocalDateTime rideDepartureTime, 
            Integer totalAvailableSeats, 
            BigDecimal basePrice, 
            BigDecimal pricePerKm, 
            BigDecimal totalEstimatedCost, 
            BigDecimal totalDistance,
            String vehicleModel, 
            VehicleClass vehicleClass, 
            VehicleCategory vehicleCategory) {
            this.rideId = rideId;
            this.driverName = driverName;
            this.driverEmail = driverEmail;
            this.driverRating = driverRating;
            this.driverSourceAddress = driverSourceAddress;
            this.driverDestinationAddress = driverDestinationAddress;
            this.rideDepartureTime = rideDepartureTime;
            this.totalAvailableSeats = totalAvailableSeats;
            this.basePrice = basePrice;
            this.pricePerKm = pricePerKm;
            this.totalEstimatedCost = totalEstimatedCost;
            this.totalDistance = totalDistance;
            this.vehicleModel = vehicleModel;
            this.vehicleClass = vehicleClass.name();
            this.vehicleCategory = vehicleCategory.name();
        }
}
