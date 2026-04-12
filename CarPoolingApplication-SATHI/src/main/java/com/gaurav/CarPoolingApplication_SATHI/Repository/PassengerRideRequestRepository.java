package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
            AND prr.rideRequestStatus IN (
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.PENDING,
                com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus.ACCEPTED
            )
            AND prr.rideRequestedAt >= :dayStartedAt AND prr.rideRequestedAt <= :dayEndedAt
            ORDER BY prr.rideRequestedAt DESC
            """)
    List<PassengerRideBookingRequestsDTO> findPassengerRideBookingRequestsByDriverId(
            Long userId, Long rideId, LocalDateTime dayStartedAt, LocalDateTime dayEndedAt);
}
