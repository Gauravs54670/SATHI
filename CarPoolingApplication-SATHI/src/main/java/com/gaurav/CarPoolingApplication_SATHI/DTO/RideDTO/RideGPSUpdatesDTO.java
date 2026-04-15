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
}
