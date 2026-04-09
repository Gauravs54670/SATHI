package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.DriverPostedRides;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;

@Repository
public interface RideEntityRepository extends JpaRepository<RideEntity, Long> {
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.DriverPostedRides(
                r.rideId,
                r.sourceAddress,
                r.destinationAddress,
                r.rideDepartureTime,
                r.rideStatus,
                r.estimatedDistanceOfRide,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare
            )
            FROM RideEntity r
            WHERE r.driverProfileEntity = :driver
            AND r.rideStatus IN :statuses
            AND (r.rideStatus = 'RIDE_STARTED' OR r.rideDepartureTime >= :now)
            ORDER BY r.rideDepartureTime ASC
            """)
    List<DriverPostedRides> findFirstActiveRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("statuses") Collection<RideStatus> statuses,
        @Param("now") LocalDateTime now
    );

    @Query("SELECT COUNT(r) > 0 FROM RideEntity r WHERE r.driverProfileEntity = :driver " +
           "AND r.rideStatus IN :statuses " +
           "AND (r.rideStatus = 'RIDE_STARTED' OR r.rideDepartureTime >= :now)")
    boolean existsActiveRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("statuses") Collection<RideStatus> statuses,
        @Param("now") LocalDateTime now
    );
}
