package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class RideGPSUpdatesDTO {
    private Long rideId;
    private Double latitude;
    private Double longitude;
    private Double speed;     
    private Double heading;   
    private LocalDateTime timestamp;
    // Accumulated total distance traveled (in km) — incremented with each GPS update
    @Builder.Default
    private Double totalDistanceTraveled = 0.0;
}
