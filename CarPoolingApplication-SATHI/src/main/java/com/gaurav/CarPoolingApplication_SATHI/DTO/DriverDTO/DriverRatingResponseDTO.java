package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

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
public class DriverRatingResponseDTO {
    private String driverName;
    private String driverProfileUrl;
    private Long rideId;
    private Integer rating;
    private String review;
}
