package com.gaurav.CarPoolingApplication_SATHI.Repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRatingEntity;

public interface UserRatingRepository extends JpaRepository<UserRatingEntity, Long> {
    
}
