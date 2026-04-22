package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class DriverRideHistoryDTO {
    private Long rideId;
    private LocalDate rideDate;
    private LocalDateTime rideStartedAt;
    private LocalDateTime rideEndedAt;
    private Integer totalPassengersCount;
    private Double distanceCovered;
    private BigDecimal rideEarning;
    private String rideStartingAddress;
    private String rideEndedAddress;
    private List<RideJoinedPassengersDTO> joinedPassengers;
}
