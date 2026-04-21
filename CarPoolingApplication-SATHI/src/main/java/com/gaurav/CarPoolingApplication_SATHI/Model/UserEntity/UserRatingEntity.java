package com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity;

import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@Entity
@Table(name = "user_ratings")
public class UserRatingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ratingId;
    @ManyToOne
    @JoinColumn(name = "rated_user_id")
    private UserEntity ratedUser;
    @ManyToOne
    @JoinColumn(name = "rated_by_id")
    private UserEntity ratedBy;
    @ManyToOne
    private RideEntity rideEntity;
    @ManyToOne
    @JoinColumn(name = "ride_request_id")
    private PassengerRideRequestEntity rideRequestEntity;
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    private String review;
    private LocalDateTime ratedAt;
}
