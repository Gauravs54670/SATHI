package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for caching Ride state in Redis.
 * This avoids LazyInitializationExceptions when serializing JPA entities.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideCacheDTO {
    private Long rideId;
    private Long driverProfileId;
    private String sourceAddress;
    private String destinationAddress;
    private RideStatus rideStatus;
    private Integer totalAvailableSeats;
    private LocalDateTime rideDepartureTime;
    private LocalDateTime rideStartedAt;
}
