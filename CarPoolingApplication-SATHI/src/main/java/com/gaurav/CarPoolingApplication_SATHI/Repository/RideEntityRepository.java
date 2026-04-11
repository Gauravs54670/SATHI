package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
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
                r.offeredSeats,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare,
                r.estimatedDistanceOfRide,
                r.driverProfileEntity.vehicleModel,
                r.driverProfileEntity.vehicleClass,
                r.driverProfileEntity.vehicleCategory
            )
            FROM RideEntity r
            WHERE r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED')
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
                r.offeredSeats,
                r.baseFare,
                r.pricePerKm,
                r.estimatedFare,
                r.estimatedDistanceOfRide,
                r.driverProfileEntity.vehicleModel,
                r.driverProfileEntity.vehicleClass,
                r.driverProfileEntity.vehicleCategory
            )
            FROM RideEntity r
            WHERE r.rideStatus IN ('RIDE_POSTED', 'RIDE_STARTED')
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
}
