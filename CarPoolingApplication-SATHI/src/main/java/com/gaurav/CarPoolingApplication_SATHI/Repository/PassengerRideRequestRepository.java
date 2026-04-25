package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.PassengerRideHistoryDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideJoinedPassengersDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverAcceptedRideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.PassengerRideBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAcceptedPassengerDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.PassengerRideReceiptDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideAcceptedDriverDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;
import org.springframework.data.repository.query.Param;

public interface PassengerRideRequestRepository extends JpaRepository<PassengerRideRequestEntity, Long> {
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideRequestUpdatesDTO(
                prr.rideEntity.rideId,
                prr.rideRequestId,
                prr.rideRequestStatus,
                prr.rideRequestedAt,
                prr.rideEntity.driverProfileEntity.user.userFullName,
                prr.rideEntity.rideDepartureTime,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                prr.requestedSeats,
                prr.rideEntity.estimatedFare,
                prr.finalFare,
                prr.estimatedFareAtRequest,
                prr.fullJourneyFare,
                prr.totalSeatsOffered,
                prr.rideEntity.rideStatus,
                prr.isDriverReachedPickupLocation,
                prr.rejectionCount,
                prr.numberOfRequests
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.passengerEntity.userId = :userId
            AND prr.rideRequestStatus IN (
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.PENDING,
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED,
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.REJECTED,
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.DRIVER_REACHED_PICKUP_LOCATION,
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ONBOARDED
            )
            AND prr.rideEntity.rideDepartureTime BETWEEN :windowStart AND :windowEnd
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<RideRequestUpdatesDTO> findRideRequestUpdatesByPassengerId(
            Long userId, LocalDateTime windowStart, LocalDateTime windowEnd);

    // get passenger booking requests for drivers
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.PassengerRideBookingRequestsDTO(
                prr.rideRequestId,
                prr.passengerEntity.userFullName,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                prr.rideRequestStatus,
                prr.requestedSeats,
                prr.rideRequestedAt,
                prr.passengerEntity.phoneNumber
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.rideEntity.driverProfileEntity.user.userId = :userId
            AND prr.rideEntity.rideId = :rideId
            AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.PENDING
            AND prr.rideEntity.rideDepartureTime BETWEEN :startWindow AND :endWindow
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<PassengerRideBookingRequestsDTO> findPassengerRideBookingRequestsByDriverId(
            Long userId, Long rideId, LocalDateTime startWindow, LocalDateTime endWindow);

    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverAcceptedRideRequestDTO(
                prr.rideEntity.rideId,
                prr.rideRequestId,
                prr.passengerEntity.userFullName,
                prr.passengerEntity.phoneNumber,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                prr.requestedSeats,
                prr.rideRequestStatus
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.rideEntity.driverProfileEntity.user.userId = :userId
            AND prr.rideEntity.rideId = :rideId
            AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
            AND prr.rideEntity.rideDepartureTime BETWEEN :startWindow AND :endWindow
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<DriverAcceptedRideRequestDTO> findDriverAcceptedRideRequestsByDriverId(
            Long userId, Long rideId, LocalDateTime startWindow, LocalDateTime endWindow);
    // Global Check: Does this passenger have ANY accepted ride within this time window?
    @Query("""
        SELECT COUNT(prr) > 0 
        FROM PassengerRideRequestEntity prr 
        WHERE prr.passengerEntity.userId = :userId 
        AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
        AND prr.rideEntity.rideDepartureTime BETWEEN :startTime AND :endTime
    """)
    boolean hasOverlappingAcceptedRide(Long userId, LocalDateTime startTime, LocalDateTime endTime);
    Optional<PassengerRideRequestEntity> findByPassengerEntity_UserIdAndRideEntity_RideId(Long userId, Long rideId);
    // Cleanup: Find all OTHER pending requests from this passenger within this window
    @Query("""
        SELECT prr 
        FROM PassengerRideRequestEntity prr 
        WHERE prr.passengerEntity.userId = :userId 
        AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.PENDING
        AND prr.rideRequestId != :currentRequestId
        AND prr.rideEntity.rideDepartureTime BETWEEN :startTime AND :endTime
    """)
    List<PassengerRideRequestEntity> findOverlappingPendingRequests(
            Long userId, Long currentRequestId, LocalDateTime startTime, LocalDateTime endTime);

    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAcceptedPassengerDTO(
                prr.rideRequestId,
                prr.passengerEntity.userFullName,
                prr.passengerEntity.email,
                prr.passengerEntity.phoneNumber,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                prr.requestedSeats,
                prr.passengerEntity.gender,
                prr.rideRequestStatus,
                prr.passengerEntity.profilePictureUrl,
                prr.rideEntity.rideDepartureTime,
                (SELECT COUNT(ur) > 0 FROM UserRatingEntity ur WHERE ur.rideRequestEntity.rideRequestId = prr.rideRequestId AND ur.ratedBy.userId = prr.rideEntity.driverProfileEntity.user.userId)
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.rideEntity.driverProfileEntity.user.userId = :userId
            AND prr.rideEntity.rideId = :rideId
            AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
            AND prr.rideEntity.rideDepartureTime BETWEEN :startWindow AND :endWindow
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<RideAcceptedPassengerDTO> findRideAcceptedPassengersByDriverId(
            Long userId, Long rideId, LocalDateTime startWindow, LocalDateTime endWindow);

    // Passenger view: Get the accepted driver's details for a specific ride request
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.PassengerRideReceiptDTO(
                prr.rideRequestId,
                prr.rideEntity.rideId,
                prr.rideEntity.driverProfileEntity.user.userFullName,
                prr.rideEntity.driverProfileEntity.user.phoneNumber,
                prr.rideEntity.driverProfileEntity.user.profilePictureUrl,
                prr.rideEntity.driverProfileEntity.vehicleModel,
                prr.rideEntity.driverProfileEntity.vehicleNumber,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                prr.rideEntity.rideDepartureTime,
                prr.rideCompletedAt,
                prr.rideEntity.rideStatus,
                prr.fullJourneyFare,
                prr.estimatedFareAtRequest,
                prr.finalFare,
                prr.totalSeatsOffered,
                prr.requestedSeats,
                prr.rideEntity.actualDistanceOfRide
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.rideRequestId = :rideRequestId
            AND prr.passengerEntity.userId = :userId
            """)
    Optional<PassengerRideReceiptDTO> findRideReceiptByRequestIdAndPassengerId(Long rideRequestId, Long userId);

    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerDTO.RideAcceptedDriverDTO(
                prr.rideRequestId,
                prr.rideEntity.rideId,
                prr.rideEntity.driverProfileEntity.user.userFullName,
                prr.rideEntity.driverProfileEntity.user.phoneNumber,
                prr.rideEntity.driverProfileEntity.user.profilePictureUrl,
                prr.rideEntity.rideStatus,
                prr.rideEntity.driverProfileEntity.vehicleModel,
                prr.rideEntity.driverProfileEntity.vehicleNumber,
                prr.rideEntity.sourceAddress,
                prr.rideEntity.destinationAddress,
                prr.rideEntity.rideDepartureTime,
                prr.rideEntity.estimatedFare
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.passengerEntity.userId = :userId
            AND prr.rideRequestId = :rideRequestId
            AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
            """)
    List<RideAcceptedDriverDTO> findRideAcceptedDriversByPassengerId(Long userId, Long rideRequestId);

    List<PassengerRideRequestEntity> findByRideEntity_RideIdAndRideRequestStatus(Long rideId, RideRequestStatus status);

    Optional<PassengerRideRequestEntity> findByRideEntity_RideIdAndRideRequestId(Long rideId, Long rideRequestId);

    List<PassengerRideRequestEntity> findByRideEntity_RideId(Long rideId);

    @Query("""
        SELECT COALESCE(SUM(prr.requestedSeats), 0)
        FROM PassengerRideRequestEntity prr
        WHERE prr.rideEntity.rideId = :rideId
        AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ONBOARDED
        """)
    int countOnboardedSeatsForRide(Long rideId);
    Optional<PassengerRideRequestEntity> findByRideRequestIdAndPassengerEntity_UserId(Long rideRequestId, Long userId);
    @Query("""
        SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideJoinedPassengersDTO(
            prr.rideEntity.rideId,
            prr.rideRequestId,
            prr.passengerEntity.userFullName,
            prr.requestedSeats,
            prr.passengerSourceLocation,
            prr.passengerDestinationLocation,
            (SELECT COUNT(ur) > 0 FROM UserRatingEntity ur WHERE ur.rideRequestEntity.rideRequestId = prr.rideRequestId AND ur.ratedBy.userId = prr.rideEntity.driverProfileEntity.user.userId)
        )
        FROM PassengerRideRequestEntity prr
        WHERE prr.rideEntity.rideId = :rideId
        AND prr.rideRequestStatus IN (com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.COMPLETED, com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ONBOARDED, com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.NOT_BOARDED)
        AND prr.rideEntity.driverProfileEntity.driverProfileId = :driverProfileId
        """)
        List<RideJoinedPassengersDTO> findRideJoinedPassengers(
                @Param("rideId") Long rideId,
                @Param("driverProfileId") Long driverProfileId);

    @Query("""
        SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideJoinedPassengersDTO(
            prr.rideEntity.rideId,
            prr.rideRequestId,
            prr.passengerEntity.userFullName,
            prr.requestedSeats,
            prr.passengerSourceLocation,
            prr.passengerDestinationLocation,
            (SELECT COUNT(ur) > 0 FROM UserRatingEntity ur WHERE ur.rideRequestEntity.rideRequestId = prr.rideRequestId AND ur.ratedBy.userId = prr.rideEntity.driverProfileEntity.user.userId)
        )
        FROM PassengerRideRequestEntity prr
        WHERE prr.rideEntity.rideId IN :rideIds
        AND prr.rideRequestStatus IN (com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.COMPLETED, com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ONBOARDED, com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.NOT_BOARDED)
        AND prr.rideEntity.driverProfileEntity.driverProfileId = :driverProfileId
        """)
        List<RideJoinedPassengersDTO> findRideJoinedPassengersBulk(
                @Param("rideIds") List<Long> rideIds,
                @Param("driverProfileId") Long driverProfileId);
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.PassengerRideHistoryDTO(
                prr.rideEntity.rideId,
                prr.rideRequestId,
                prr.rideEntity.driverProfileEntity.user.userFullName,
                prr.requestedSeats,
                prr.passengerSourceLocation,
                prr.passengerDestinationLocation,
                (SELECT COUNT(ur) > 0 FROM UserRatingEntity ur WHERE ur.rideRequestEntity.rideRequestId = prr.rideRequestId AND ur.ratedBy.userId = :userId)
            )
            FROM PassengerRideRequestEntity prr
            WHERE prr.passengerEntity.userId = :userId
            AND prr.rideRequestStatus IN (com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.REJECTED, com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.COMPLETED)
            """)
    List<PassengerRideHistoryDTO> getPassengerRideHistoryDTO(@Param("userId") Long userId);
}