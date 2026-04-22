package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.AvailablePostedRideDTO;
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
                r.rideCreatedAt,
                r.rideStatus,
                r.estimatedDistanceOfRide,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare,
                r.offeredSeats,
                r.totalAvailableSeats
            )
            FROM RideEntity r
            WHERE r.driverProfileEntity = :driver
            AND r.rideStatus IN :statuses
            AND (r.rideStatus IN ('RIDE_STARTED', 'RIDE_IN_PROGRESS') OR r.rideDepartureTime >= :now)
            ORDER BY r.rideDepartureTime ASC
            """)
    List<DriverPostedRides> findFirstActiveRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("statuses") Collection<RideStatus> statuses,
        @Param("now") LocalDateTime now
    );

    @Query("SELECT COUNT(r) > 0 FROM RideEntity r WHERE r.driverProfileEntity = :driver " +
           "AND r.rideStatus IN :statuses " +
           "AND (r.rideStatus IN ('RIDE_STARTED', 'RIDE_IN_PROGRESS') OR r.rideDepartureTime >= :now)")
    boolean existsActiveRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("statuses") Collection<RideStatus> statuses,
        @Param("now") LocalDateTime now
    );
    // get available rides for passengers
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO(
                r.rideId,
                r.driverProfileEntity.user.userFullName,
                r.driverProfileEntity.user.email,
                r.driverProfileEntity.user.averageRating,
                r.sourceAddress,
                r.destinationAddress,
                r.rideDepartureTime,
                r.totalAvailableSeats,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare,
                r.estimatedDistanceOfRide,
                r.driverProfileEntity.vehicleModel,
                r.driverProfileEntity.vehicleClass,
                r.driverProfileEntity.vehicleCategory
            )
            FROM RideEntity r
            WHERE r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS')
            AND r.rideDepartureTime >= :now
            AND r.totalAvailableSeats > 0
            AND (:city IS NULL OR :city = '' OR LOWER(r.sourceAddress) LIKE LOWER(CONCAT('%', :city, '%')))
            ORDER BY r.rideDepartureTime ASC
            """)
    List<AvailablePostedRideDTO> findAvailableRides(
        @Param("now") LocalDateTime now, @Param("city") String city);

    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO(
                r.rideId,
                r.driverProfileEntity.user.userFullName,
                r.driverProfileEntity.user.email,
                r.driverProfileEntity.user.averageRating,
                r.sourceAddress,
                r.destinationAddress,
                r.rideDepartureTime,
                r.totalAvailableSeats,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare,
                r.estimatedDistanceOfRide,
                r.driverProfileEntity.vehicleModel,
                r.driverProfileEntity.vehicleClass,
                r.driverProfileEntity.vehicleCategory
            )
            FROM RideEntity r
            WHERE r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS')
            AND r.rideDepartureTime >= :now
            AND r.totalAvailableSeats > 0
            AND (:city IS NULL OR :city = '' OR LOWER(r.sourceAddress) LIKE LOWER(CONCAT('%', :city, '%')))
            AND (:sLat IS NULL OR (r.sourceLat BETWEEN :sLat - :radius AND :sLat + :radius))
            AND (:sLng IS NULL OR (r.sourceLng BETWEEN :sLng - :radius AND :sLng + :radius))
            AND (:dLat IS NULL OR (r.destinationLat BETWEEN :dLat - :radius AND :dLat + :radius))
            AND (:dLng IS NULL OR (r.destinationLng BETWEEN :dLng - :radius AND :dLng + :radius))
            ORDER BY r.rideDepartureTime ASC
            """)
    List<AvailablePostedRideDTO> findAvailableRidesWithFilter(
        @Param("now") LocalDateTime now, 
        @Param("city") String city,
        @Param("sLat") Double sLat,
        @Param("sLng") Double sLng,
        @Param("dLat") Double dLat,
        @Param("dLng") Double dLng,
        @Param("radius") Double radius
    );
    Optional<RideEntity> findByRideIdAndDriverProfileEntity(Long rideId, DriverProfileEntity driverProfileEntity);
    Optional<RideEntity> findByRideIdAndDriverProfileEntity_DriverProfileId(Long rideId, Long driverProfileId);
    @Query("""
        SELECT COUNT(r) > 0 
        FROM RideEntity r 
        WHERE r.driverProfileEntity = :driver 
        AND r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS')
        AND r.rideDepartureTime BETWEEN :windowStart AND :windowEnd
        AND (r.sourceLat BETWEEN :sLat - :radius AND :sLat + :radius)
        AND (r.sourceLng BETWEEN :sLng - :radius AND :sLng + :radius)
        AND (r.destinationLat BETWEEN :dLat - :radius AND :dLat + :radius)
        AND (r.destinationLng BETWEEN :dLng - :radius AND :dLng + :radius)
    """)
    boolean existsDuplicatePostedRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("windowStart") LocalDateTime windowStart,
        @Param("windowEnd") LocalDateTime windowEnd,
        @Param("sLat") Double sLat,
        @Param("sLng") Double sLng,
        @Param("dLat") Double dLat,
        @Param("dLng") Double dLng,
        @Param("radius") Double radius
    );

    @Query("""
        SELECT COUNT(r) > 0 
        FROM RideEntity r 
        WHERE r.driverProfileEntity = :driver 
        AND r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS')
        AND r.rideDepartureTime BETWEEN :windowStart AND :windowEnd
    """)
    boolean existsConflictingRide(
        @Param("driver") DriverProfileEntity driver,
        @Param("windowStart") LocalDateTime windowStart,
        @Param("windowEnd") LocalDateTime windowEnd
    );
    // check is there a ride whose staus is already IN_PROGRESS
    @Query("""
        SELECT COUNT(r) > 0 
        FROM RideEntity r 
        WHERE r.driverProfileEntity.driverProfileId = :driverProfileId 
        AND r.rideStatus IN ('RIDE_IN_PROGRESS')
    """)
    boolean existsInProgressRide(@Param("driverProfileId") Long driverProfileId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RideEntity r WHERE r.rideId = :id")
    Optional<RideEntity> findWithPessimisticLockById(@Param("id") Long id);
    @Query("""
            SELECT r
            FROM RideEntity r
            WHERE r.driverProfileEntity.driverProfileId = :driverProfileId
            AND r.rideStatus IN ('RIDE_COMPLETED','RIDE_CANCELLED')
            ORDER BY r.rideDepartureTime DESC
            """)
    List<RideEntity> findByDriverProfileId(@Param("driverProfileId") Long driverProfileId);
}
