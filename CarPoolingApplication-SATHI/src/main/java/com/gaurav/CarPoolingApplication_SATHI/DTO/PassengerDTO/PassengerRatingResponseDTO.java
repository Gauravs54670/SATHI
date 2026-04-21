package com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO;

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
public class PassengerRatingResponseDTO {
    private String passengerName;
    private String passengerProfileUrl;
    private Long rideRequestId;
    private Integer rating;
    private String review;
}
