package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideAcceptedDriverDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingRequestToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingResponseToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.Exception.InvalidRideStateException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoEntryFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.TooManyRequestException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationType;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Repository.PassengerRideRequestRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.RideEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Service.Notification.NotificationService;

@Service
@Slf4j
public class PassengerServiceImplementation implements PassengerService {

    // Redis key prefix for user profiles
    private static final String AVAILABLE_RIDES_GLOBAL_CACHE_KEY = "rides:available";
    // Cache TTL (time-to-live) in minutes
    // redis keys for ride request rate limiting
    private static final String RIDE_REQUEST_COUNT_PREFIX = "ride:request:count";
    private static final Long RIDE_REQUEST_TIME_LIMIT = 2L;   
    private static final String ACTIVE_RIDES_REQUESTS_CACHE_PREFIX = "active:rides:requests:";
    // ride request updates cache key
    private static final String RIDE_REQUEST_UPDATES_CACHE_KEY = "ride:request:user:updates";
    // ride request updates cache ttl
    private static final long RIDE_REQUEST_UPDATES_CACHE_TTL = 1;
    // available rides ttl
    private static final long CACHE_TTL_MINUTES = 10;
    // ride accepted drivers cache key
    private static final String RIDE_ACCEPTED_DRIVERS_CACHE_PREFIX = "ride:accepted:drivers:";

    private final RedisTemplate<String,Object> redisTemplate;
    private final UserEntityRepository userEntityRepository;
    private final RideEntityRepository rideEntityRepository;
    private final PassengerRideRequestRepository passengerRideRequestRepository;
    private final NotificationService notificationService;

    public PassengerServiceImplementation(
        PassengerRideRequestRepository passengerRideRequestRepository,
        RedisTemplate<String,Object> redisTemplate,
        UserEntityRepository userEntityRepository, 
        RideEntityRepository rideEntityRepository,
        NotificationService notificationService) {
        this.passengerRideRequestRepository = passengerRideRequestRepository;
        this.redisTemplate = redisTemplate;
        this.userEntityRepository = userEntityRepository;
        this.rideEntityRepository = rideEntityRepository;
        this.notificationService = notificationService;
    }
    // get available rides with caching and proximity filtering support
    @Override
    public List<AvailablePostedRideDTO> getAvailableRides(
        String email, String city, Double sLat, Double sLng, Double dLat, Double dLng) {
        // Fetch the user from the database to identify who is making the request
        UserEntity userEntity = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));    
        // Validate that the user's account is verified, active, and not suspended
        validatePassengerAccount(userEntity);
        // Check if geospatial coordinates (latitude/longitude) are provided for a proximity search
        boolean hasCoords = sLat != null && sLng != null && dLat != null && dLng != null;
        // Initialize cacheKey; it will stay null if we are performing a fresh coordinate-based search
        String cacheKey = null;
        // If NO coordinates are provided, we use caching to avoid heavy DB queries
        if (!hasCoords) {
            // Generate key: either global (rides:available) or city-specific (rides:available:delhi)
            cacheKey = (city == null || city.trim().isEmpty()) 
                        ? AVAILABLE_RIDES_GLOBAL_CACHE_KEY 
                        : AVAILABLE_RIDES_GLOBAL_CACHE_KEY + ":" + city.trim().toLowerCase();
        }
        List<AvailablePostedRideDTO> availableRides = null;
        // If we have a cache key (meaning city/global search), try fetching from Redis
        if (cacheKey != null) {
            @SuppressWarnings("unchecked")
            List<AvailablePostedRideDTO> cached = (List<AvailablePostedRideDTO>) redisTemplate.opsForValue().get(cacheKey);
            availableRides = cached; // This will be null if the key expired (Cache Miss)
        }
        // If results weren't in cache (Cache Miss) OR we skipped cache because of coordinates
        if (availableRides == null) {
            if (hasCoords) {
                // Perform a Geospatial Query to find rides within a start/end proximity (~5.5km)
                availableRides = this.rideEntityRepository.findAvailableRidesWithFilter(
                    LocalDateTime.now(), city, sLat, sLng, dLat, dLng, 0.05);
            } else {
                // Fetch rides from DB filtered only by city (or all available if no city provided)
                availableRides = this.rideEntityRepository.findAvailableRides(LocalDateTime.now(), city);
            }
            // If we just fetched a City or Global list from DB, save it to Redis for next time
            if (cacheKey != null) {
                this.redisTemplate.opsForValue().set(cacheKey, availableRides, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            }
        }
        // Final Filter: Loop through results and remove any rides where the user is the driver
        // (Prevents someone from booking a seat in a ride they have posted themselves)
        final String passengerEmail = userEntity.getEmail();
        availableRides.removeIf(ride -> ride.getDriverEmail().equals(passengerEmail));
        // Return the final list of available rides to the user
        return availableRides;
    }
    // request ride
    @Override
    @Transactional
    public RideSharingResponseToPostedRide requestRide(String email, RideSharingRequestToPostedRide rideSharingRequestToPostedRide) {
        log.info("Processing ride request from user: {} for rideId: {}", email, rideSharingRequestToPostedRide.getRideId());
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> {
                log.error("User not found: {}", email);
                return new UserNotFoundException("User not found.");
            });
        validatePassengerAccount(user);
        // 2. RATE LIMITING (max 3 requests per RIDE_REQUEST_TIME_LIMIT minutes)
        //    Uses userId so it can't be bypassed by changing email casing
        String rateLimitKey = RIDE_REQUEST_COUNT_PREFIX + ":" + user.getUserId();
        try {
            Long count = redisTemplate.opsForValue().increment(rateLimitKey);
            if (count != null && count > 3) {
                Long ttl = redisTemplate.getExpire(rateLimitKey, TimeUnit.MINUTES);
                long waitMinutes = (ttl != null && ttl > 0) ? ttl : RIDE_REQUEST_TIME_LIMIT;
                log.warn("Rate limit exceeded for user: {}. Count: {}, TTL: {} min", email, count, waitMinutes);
                throw new TooManyRequestException(
                    "You are sending too many requests. Please try again after " + waitMinutes + " minute(s).");
            }
            // Set TTL only on first increment to start the sliding window
            if (count != null && count == 1) {
                this.redisTemplate.expire(rateLimitKey, RIDE_REQUEST_TIME_LIMIT, TimeUnit.MINUTES);
            }
        } catch (TooManyRequestException e) {
            throw e; // re-throw to UI
        } catch (Exception e) {
            log.error("Redis error during rate limiting for user {}: {}. Proceeding without rate limit.", email, e.getMessage());
            throw new TooManyRequestException("Too many requests. Please try again later.");
        }
        RideEntity rideEntity = this.rideEntityRepository.findById(rideSharingRequestToPostedRide.getRideId())
            .orElseThrow(() -> {
                log.error("Ride not found: {}", rideSharingRequestToPostedRide.getRideId());
                return new InvalidRideStateException("Ride not found.");
            });
        switch (rideEntity.getRideStatus()) {
            case RIDE_CANCELLED:
                throw new InvalidRideStateException("This ride has been cancelled by the driver.");
            case RIDE_COMPLETED:
                throw new InvalidRideStateException("This ride has already been completed.");
            case RIDE_FULL:
                throw new InvalidRideStateException("This ride is full. No seats available.");
            case RIDE_IN_PROGRESS:
                throw new InvalidRideStateException("This ride is already in progress.");
            default:
                break;
        }
        if (rideEntity.getRideDepartureTime().isBefore(LocalDateTime.now()))
            throw new InvalidRideStateException("This ride has already departed. Please choose a different ride.");
        // 4a. Passenger cannot request their own posted ride
        if (rideEntity.getDriverProfileEntity().getUser().getUserId().equals(user.getUserId()))
            throw new AccessDeniedException("You cannot request a ride that you have posted.");
        // 4b. Check seat availability
        if (rideEntity.getTotalAvailableSeats() < rideSharingRequestToPostedRide.getSeatsRequired())
            throw new InvalidRideStateException(
                "Not enough seats available. Only " + rideEntity.getTotalAvailableSeats() + " seat(s) left.");
        // 4c. OVERLAPPING RIDE CHECK: Is this passenger already ACCEPTED on another ride in the same time window?
        LocalDateTime windowStart = rideEntity.getRideDepartureTime().minusHours(1);
        LocalDateTime windowEnd = rideEntity.getRideDepartureTime().plusHours(1);
        boolean hasConflict = this.passengerRideRequestRepository
            .hasOverlappingAcceptedRide(user.getUserId(), windowStart, windowEnd); 
        if (hasConflict) {
            throw new InvalidRideStateException(
                "You are already booked on another ride during this time window. " +
                "You cannot request more rides until your current booking is complete or cancelled.");
        }
        // 5. DUPLICATE / RE-REQUEST LOGIC
        //    - If PENDING or ACCEPTED → block (already requested)
        //    - If REJECTED → allow re-request up to 4 total rejections
        //    - If CANCELLED (due to max rejections) → permanently blocked
        //    - If no existing request → create new
        Optional<PassengerRideRequestEntity> existingRequestOpt = this.passengerRideRequestRepository
            .findByPassengerEntity_UserIdAndRideEntity_RideId(user.getUserId(), rideEntity.getRideId());
        PassengerRideRequestEntity passengerRideRequestEntity;
        if (existingRequestOpt.isPresent()) {
            PassengerRideRequestEntity existingReq = existingRequestOpt.get();
            RideRequestStatus currentStatus = existingReq.getRideRequestStatus();

            if (currentStatus == RideRequestStatus.PENDING) {
                log.warn("Passenger {} already has a PENDING request for ride {}", email, rideEntity.getRideId());
                throw new InvalidRideStateException("You have already requested this ride. Please wait for the driver to respond.");
            }

            if (currentStatus == RideRequestStatus.ACCEPTED) {
                log.warn("Passenger {} already ACCEPTED for ride {}", email, rideEntity.getRideId());
                throw new InvalidRideStateException("Your request for this ride has already been accepted by the driver.");
            }

            if (currentStatus == RideRequestStatus.CANCELLED || currentStatus == RideRequestStatus.REJECTED) {
                int currentRejectionCount = existingReq.getRejectionCount() != null ? existingReq.getRejectionCount() : 0;
                
                // 1. If it was REJECTED and reached 4, we move it to CANCELLED and block
                if (currentStatus == RideRequestStatus.REJECTED && currentRejectionCount >= 4) {
                    existingReq.setRideRequestStatus(RideRequestStatus.CANCELLED);
                    existingReq.setRideCancelledAt(LocalDateTime.now());
                    this.passengerRideRequestRepository.save(existingReq);
                    log.warn("Passenger {} reached max rejections ({}) for ride {}. Status set to CANCELLED.",
                        email, currentRejectionCount, rideEntity.getRideId());
                    throw new InvalidRideStateException(
                        "The driver has rejected your request " + currentRejectionCount + " times. " +
                        "You have been blocked from this ride. Please choose a different ride.");
                }

                // 2. If it was already CANCELLED and rejections are maxed, it's a permanent block
                if (currentStatus == RideRequestStatus.CANCELLED && currentRejectionCount >= 4) {
                    log.warn("Passenger {} is permanently BLOCKED from ride {} due to previous max rejections", email, rideEntity.getRideId());
                    throw new InvalidRideStateException(
                        "You have been blocked from requesting this ride due to multiple rejections. Please choose a different ride.");
                }

                // 3. Otherwise, allow re-request (covers both REJECTED < 4 and voluntary CANCELLED)
                int currentNumberOfRequests = existingReq.getNumberOfRequests() != null ? existingReq.getNumberOfRequests() : 1;
                existingReq.setNumberOfRequests(currentNumberOfRequests + 1);
                existingReq.setRideRequestStatus(RideRequestStatus.PENDING);
                existingReq.setRideCancelledAt(null); // Clear cancellation timestamp if reviving
                existingReq.setRequestedSeats(rideSharingRequestToPostedRide.getSeatsRequired());
                existingReq.setPassengerSourceLng(rideSharingRequestToPostedRide.getPassengerSourceLng());
                existingReq.setPassengerSourceLat(rideSharingRequestToPostedRide.getPassengerSourceLat());
                existingReq.setPassengerSourceLocation(rideSharingRequestToPostedRide.getPassengerSourceLocation());
                existingReq.setPassengerDestinationLng(rideSharingRequestToPostedRide.getPassengerDestinationLng());
                existingReq.setPassengerDestinationLat(rideSharingRequestToPostedRide.getPassengerDestinationLat());
                existingReq.setPassengerDestinationLocation(rideSharingRequestToPostedRide.getPassengerDestinationLocation());
                existingReq.setRideRequestedAt(LocalDateTime.now());

                passengerRideRequestEntity = existingReq;
                log.info("Passenger {} re-requesting ride {}. Status was {}, Attempt #{}, Rejection count: {}",
                    email, rideEntity.getRideId(), currentStatus, passengerRideRequestEntity.getNumberOfRequests(), currentRejectionCount);

                // Notify driver about the re-request
                notificationService.createNotification(
                    rideEntity.getDriverProfileEntity().getUser(),
                    String.format("%s has re-requested your ride from %s to %s (Attempt #%d)", 
                        user.getUserFullName(), rideEntity.getSourceAddress(), rideEntity.getDestinationAddress(), passengerRideRequestEntity.getNumberOfRequests()),
                    NotificationType.RIDE_REQUESTED,
                    passengerRideRequestEntity.getRideRequestId()
                );
            } else {
                // Catch-all for any unexpected status (COMPLETED, NOT_BOARDED, etc.)
                log.warn("Passenger {} has unexpected status {} for ride {}", email, currentStatus, rideEntity.getRideId());
                throw new InvalidRideStateException("Cannot request this ride. Current request status: " + currentStatus);
            }
        } else {
            // 6. CREATE NEW RIDE REQUEST
            passengerRideRequestEntity = PassengerRideRequestEntity.builder()
                .rideEntity(rideEntity)
                .passengerEntity(user)
                .requestedSeats(rideSharingRequestToPostedRide.getSeatsRequired())
                .passengerSourceLng(rideSharingRequestToPostedRide.getPassengerSourceLng())
                .passengerSourceLat(rideSharingRequestToPostedRide.getPassengerSourceLat())
                .passengerSourceLocation(rideSharingRequestToPostedRide.getPassengerSourceLocation())
                .passengerDestinationLng(rideSharingRequestToPostedRide.getPassengerDestinationLng())
                .passengerDestinationLat(rideSharingRequestToPostedRide.getPassengerDestinationLat())
                .passengerDestinationLocation(rideSharingRequestToPostedRide.getPassengerDestinationLocation())
                .rideRequestStatus(RideRequestStatus.PENDING)
                .rideRequestedAt(LocalDateTime.now())
                .build();
            log.info("New ride request created by passenger {} for ride {}", email, rideEntity.getRideId());
            
            // Notify driver
            notificationService.createNotification(
                rideEntity.getDriverProfileEntity().getUser(),
                String.format("New ride request from %s for your ride from %s to %s", 
                    user.getUserFullName(), rideEntity.getSourceAddress(), rideEntity.getDestinationAddress()),
                NotificationType.RIDE_REQUESTED,
                passengerRideRequestEntity.getRideRequestId()
            );
        }
        // 7. SAVE & POST-SAVE OPERATIONS
        this.passengerRideRequestRepository.save(passengerRideRequestEntity);
        log.info("Ride request saved for passenger {} on ride {}. Request ID: {}, Status: {}, numberOfRequests: {}",
            email, rideEntity.getRideId(), passengerRideRequestEntity.getRideRequestId(),
            passengerRideRequestEntity.getRideRequestStatus(), passengerRideRequestEntity.getNumberOfRequests());
        // 7a. Invalidate driver's ride request cache (so driver sees the new request immediately)
        this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideEntity.getRideId() + ":unified");

        // 7b. Invalidate passenger's own ride updates cache (so modal shows PENDING immediately)
        this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + email);
        // 8. BUILD & RETURN RESPONSE
        return RideSharingResponseToPostedRide.builder()
            .rideId(rideEntity.getRideId())
            .rideRequestId(passengerRideRequestEntity.getRideRequestId())
            .passengerName(user.getUserFullName())
            .passengerSourceAddress(passengerRideRequestEntity.getPassengerSourceLocation())
            .passengerDestinationAddress(passengerRideRequestEntity.getPassengerDestinationLocation())
            .requestStatus(passengerRideRequestEntity.getRideRequestStatus().toString())
            .requestedSeats(passengerRideRequestEntity.getRequestedSeats())
            .requestedAt(passengerRideRequestEntity.getRideRequestedAt())
            .build();
    }
    // get posted ride sharing request updates
    @Override
    public List<RideRequestUpdatesDTO> getRideRequestUpdates(String email) {
        String cacheKey = RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + email;
        @SuppressWarnings("unchecked")
        List<RideRequestUpdatesDTO> cachedUpdates = (List<RideRequestUpdatesDTO>) redisTemplate.opsForValue().get(cacheKey);
        if(cachedUpdates != null)
            return cachedUpdates;
        UserEntity userEntity = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validatePassengerAccount(userEntity);
        LocalDateTime windowStart = LocalDateTime.now().minusWeeks(1);
        LocalDateTime windowEnd = LocalDateTime.now().plusWeeks(1);
        List<RideRequestUpdatesDTO> rideRequestUpdates = this.passengerRideRequestRepository.findRideRequestUpdatesByPassengerId(
            userEntity.getUserId(), windowStart, windowEnd);
        this.redisTemplate.opsForValue().set(cacheKey, rideRequestUpdates, RIDE_REQUEST_UPDATES_CACHE_TTL, TimeUnit.MINUTES);
        return rideRequestUpdates;
    }
    @Override
    @Transactional
    public void cancelRideRequest(String email, Long rideRequestId) {
        UserEntity passengerEntity = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validatePassengerAccount(passengerEntity);
        
        PassengerRideRequestEntity rideRequestEntity = this.passengerRideRequestRepository
            .findById(rideRequestId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));

        if (!rideRequestEntity.getPassengerEntity().getUserId().equals(passengerEntity.getUserId())) {
            throw new AccessDeniedException("You are not authorized to cancel this ride request.");
        }

        RideRequestStatus currentStatus = rideRequestEntity.getRideRequestStatus();
        if (currentStatus == RideRequestStatus.CANCELLED) {
            throw new InvalidRideStateException("Ride request is already CANCELLED.");
        }
        if (currentStatus == RideRequestStatus.COMPLETED || currentStatus == RideRequestStatus.REJECTED || currentStatus == RideRequestStatus.NOT_BOARDED) {
            throw new InvalidRideStateException("Cannot cancel a ride request that is " + currentStatus);
        }

        RideEntity rideEntity = rideRequestEntity.getRideEntity();
        if (currentStatus == RideRequestStatus.ACCEPTED) {
            rideEntity.setTotalAvailableSeats(rideEntity.getTotalAvailableSeats() + rideRequestEntity.getRequestedSeats());
            if (rideEntity.getRideStatus() == RideStatus.RIDE_FULL) 
                rideEntity.setRideStatus(RideStatus.RIDE_POSTED);
            this.rideEntityRepository.save(rideEntity);
            log.info("Seats restored for ride {}. New available seats: {}", rideEntity.getRideId(), rideEntity.getTotalAvailableSeats());

            // Since seats changed, invalidate all global available ride caches so they reflect the new seat count
            java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
            if (availableRideKeys != null && !availableRideKeys.isEmpty()) {
                this.redisTemplate.delete(availableRideKeys);
            }
            // Invalidate driver's active ride display
            String driverEmail = rideEntity.getDriverProfileEntity().getUser().getEmail();
            this.redisTemplate.delete("driver:rides:" + driverEmail);
        }
        rideRequestEntity.setRideRequestStatus(RideRequestStatus.CANCELLED);
        rideRequestEntity.setRideCancelledAt(LocalDateTime.now());
        this.passengerRideRequestRepository.save(rideRequestEntity);
        log.info("Ride request {} cancelled by passenger {}", rideRequestId, email);

        // Notify Driver
        notificationService.createNotification(
            rideEntity.getDriverProfileEntity().getUser(),
            String.format("Passenger %s has cancelled their request for your ride from %s to %s", 
                passengerEntity.getUserFullName(), rideEntity.getSourceAddress(), rideEntity.getDestinationAddress()),
            NotificationType.RIDE_CANCELLED,
            rideRequestId
        );
        
        // Invalidate caches
        this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + email);
        this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideEntity.getRideId() + ":unified");
    }
    // validate passenger account
    private void validatePassengerAccount(UserEntity userEntity) {
        if(!userEntity.getIsEmailVerified())
            throw new AccessDeniedException("Account is not verified.");
        if(userEntity.getIsAdminSuspendedAccount() || 
            userEntity.getAccountStatus() == UserAccountStatus.SUSPENDED)
            throw new AccessDeniedException("Account is suspended by ADMIN.");
        if(userEntity.getAccountStatus() == UserAccountStatus.INACTIVE)
            throw new AccessDeniedException("Account is inactive.");
        if(userEntity.getAccountStatus() == UserAccountStatus.DELETED)
            throw new AccessDeniedException("Account is deleted.");
    }

    // get accepted driver details for a passenger's ride request
    @SuppressWarnings("unchecked")
    @Override
    public List<RideAcceptedDriverDTO> getRideAcceptedDrivers(String email, Long rideRequestId) {
        UserEntity userEntity = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validatePassengerAccount(userEntity);
        String cacheKey = RIDE_ACCEPTED_DRIVERS_CACHE_PREFIX + userEntity.getUserId() + ":" + rideRequestId;
        try {
            List<RideAcceptedDriverDTO> cached = (List<RideAcceptedDriverDTO>) this.redisTemplate.opsForValue().get(cacheKey);
            if (cached != null)
                return cached;
        } catch (Exception e) {
            log.error("Redis error fetching accepted drivers cache for rideRequestId {}: {}", rideRequestId, e.getMessage());
        }
        List<RideAcceptedDriverDTO> drivers = this.passengerRideRequestRepository
            .findRideAcceptedDriversByPassengerId(userEntity.getUserId(), rideRequestId);
        if (!drivers.isEmpty()) {
            try {
                this.redisTemplate.opsForValue().set(cacheKey, drivers, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.error("Redis error storing accepted drivers cache for rideRequestId {}: {}", rideRequestId, e.getMessage());
            }
        }
        return drivers;
    }
    
}
