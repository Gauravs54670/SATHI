package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;

import io.lettuce.core.dynamic.annotation.Param;

@Repository
public interface DriverEntityRepository extends JpaRepository<DriverProfileEntity, Long> {
    Optional<DriverProfileEntity> findByUserEmail(String email);
    boolean existsByLicenseNumber(String licenseNumber);
    boolean existsByVehicleNumber(String vehicleNumber);
    Optional<DriverProfileEntity> findByVehicleNumber(String vehicleNumber);
    @Query("""
        SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO(
            driver.driverProfileId,
            user.email,
            user.phoneNumber,
            user.userFullName,
            user.profilePictureUrl,
            driver.licenseNumber,
            driver.licenseExpirationDate,
            driver.vehicleModel,
            driver.vehicleNumber,
            driver.vehicleSeatCapacity,
            driver.vehicleCategory,
            driver.vehicleClass,
            driver.driverVerificationStatus,
            driver.driverAvailabilityStatus,
            driver.totalCompletedRides,
            driver.totalCancelledRides,
            user.averageRating,
            user.totalRatingsCount,
            driver.registeredAt
        )
        FROM DriverProfileEntity driver
        JOIN driver.user user
        WHERE user.email = :email
        """)
    Optional<DriverProfileDTO> findDriverProfileByEmail(@Param("email") String email);
                
}
