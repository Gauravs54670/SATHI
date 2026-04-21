package com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class UserRatingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rateingId;
    @ManyToOne
    @JoinColumn(name = "rated_user_id")
    private UserEntity ratedUser;
    @ManyToOne
    @JoinColumn(name = "rated_by_id")
    private UserEntity ratedBy;
    @ManyToOne
    private RideEntity rideEntity;
    @JoinColumn(name = "ride_request_id")
    private PassengerRideRequestEntity rideRequestEntity;
    private Integer rateing;
    private String review;
    private LocalDateTime ratedAt;
}
