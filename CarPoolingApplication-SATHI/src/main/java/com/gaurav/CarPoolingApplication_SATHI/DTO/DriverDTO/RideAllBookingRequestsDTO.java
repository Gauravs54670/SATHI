package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideAllBookingRequestsDTO {
    private List<PassengerRideBookingRequestsDTO> pendingRequests;
    private List<DriverAcceptedRideRequestDTO> acceptedPassengers;
}
