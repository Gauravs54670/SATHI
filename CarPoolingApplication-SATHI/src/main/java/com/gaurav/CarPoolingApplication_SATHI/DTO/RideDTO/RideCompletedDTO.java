package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.math.BigDecimal;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class RideCompletedDTO {
    private Long rideId;
    private String rideStatus;
    private BigDecimal totalRideFare;
    private BigDecimal rideFarePerPassenger;
    private BigDecimal systemCommission;
    private BigDecimal driverEarning;
    private BigDecimal estimatedDistance;
    private BigDecimal actualDistance;
    private BigDecimal billingDistance;
    private Integer totalPassengersCompleted;
    private Integer totalSeatsOccupied;
    private BigDecimal fullJourneyCost;
    private Integer totalSeatsOffered;
    private String message;

    public RideCompletedDTO(
        Long rideId, RideStatus rideStatus, 
        BigDecimal totalRideFare, BigDecimal rideFarePerPassenger, 
        BigDecimal systemCommission, BigDecimal driverEarning,
        BigDecimal estimatedDistance, BigDecimal actualDistance, BigDecimal billingDistance,
        Integer totalPassengersCompleted, Integer totalSeatsOccupied,
        BigDecimal fullJourneyCost, Integer totalSeatsOffered,
        String message) {
        this.rideId = rideId;
        this.rideStatus = rideStatus.name();
        this.totalRideFare = totalRideFare;
        this.rideFarePerPassenger = rideFarePerPassenger;
        this.systemCommission = systemCommission;
        this.driverEarning = driverEarning;
        this.estimatedDistance = estimatedDistance;
        this.actualDistance = actualDistance;
        this.billingDistance = billingDistance;
        this.totalPassengersCompleted = totalPassengersCompleted;
        this.totalSeatsOccupied = totalSeatsOccupied;
        this.fullJourneyCost = fullJourneyCost;
        this.totalSeatsOffered = totalSeatsOffered;
        this.message = message;
    }

}
