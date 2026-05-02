package com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
public class DriverInProgressAndPostedRides {
    private Long rideId;
    private String boardingAddress;
    private String destinationAddress;
    private LocalDateTime rideDepartureTime;
    private String rideStatus;
    private Integer totalJoinedPassengers;
    public DriverInProgressAndPostedRides(
            Long rideId,
            String boardingAddress,
            String destinationAddress,
            LocalDateTime rideDepartureTime,
            RideStatus rideStatus,
            Integer totalJoinedPassengers) {
                this.rideId = rideId;
                this.boardingAddress = boardingAddress;
                this.destinationAddress = destinationAddress;
                this.rideDepartureTime = rideDepartureTime;
                this.rideStatus = rideStatus.name();
                this.totalJoinedPassengers = totalJoinedPassengers;
    }

}
