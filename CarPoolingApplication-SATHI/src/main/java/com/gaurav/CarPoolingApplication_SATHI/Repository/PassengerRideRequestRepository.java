package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverAcceptedRideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.PassengerRideBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;

public interface PassengerRideRequestRepository extends JpaRepository<PassengerRideRequestEntity, Long> {
    Optional<PassengerRideRequestEntity> findByPassengerEntity_UserIdAndRideEntity_RideId(Long userId, Long rideId);

    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideRequestUpdatesDTO(
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
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.REJECTED
            )
            AND (prr.rideRequestedAt >= :dayStartedAt AND prr.rideRequestedAt <= :dayEndedAt)
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<RideRequestUpdatesDTO> findRideRequestUpdatesByPassengerId(
            Long userId, LocalDateTime dayStartedAt, LocalDateTime dayEndedAt);

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
            AND prr.rideRequestedAt >= :dayStartedAt AND prr.rideRequestedAt <= :dayEndedAt
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<PassengerRideBookingRequestsDTO> findPassengerRideBookingRequestsByDriverId(
            Long userId, Long rideId, LocalDateTime dayStartedAt, LocalDateTime dayEndedAt);

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
            AND prr.rideRequestedAt >= :dayStartedAt AND prr.rideRequestedAt <= :dayEndedAt
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<DriverAcceptedRideRequestDTO> findDriverAcceptedRideRequestsByDriverId(
            Long userId, Long rideId, LocalDateTime dayStartedAt, LocalDateTime dayEndedAt);
    // Global Check: Does this passenger have ANY accepted ride within this time window?
    @Query("""
        SELECT COUNT(prr) > 0 
        FROM PassengerRideRequestEntity prr 
        WHERE prr.passengerEntity.userId = :userId 
        AND prr.rideRequestStatus = com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
        AND prr.rideEntity.rideDepartureTime BETWEEN :startTime AND :endTime
    """)
    boolean hasOverlappingAcceptedRide(Long userId, LocalDateTime startTime, LocalDateTime endTime);

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
}
