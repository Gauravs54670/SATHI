package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RidePostResponseDTO {
    private Long rideId;
    private String driverName;
    private Double sourceLat;
    private Double sourceLong;
    private String boardingAddress;
    private Double destinationLat;
    private Double destinationLong;
    private String destinationAddress;
    private LocalDateTime departureTime;
    private Integer availableSeats;
    private BigDecimal basePrice;
    private BigDecimal pricePerKm;
    private BigDecimal estimatedTotalDistance;
    private BigDecimal estimatedRideFare;
    private String routePath;
}
