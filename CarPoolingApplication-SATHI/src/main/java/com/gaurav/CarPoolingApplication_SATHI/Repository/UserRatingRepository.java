package com.gaurav.CarPoolingApplication_SATHI.Repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRatingEntity;

public interface UserRatingRepository extends JpaRepository<UserRatingEntity, Long> {
    Optional<UserRatingEntity> findByRideEntity_RideIdAndRideRequestEntity_RideRequestId(
        Long rideId, Long rideRequestId
    );
}
