package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideRequestUpdatesDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingRequestToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.RideSharingResponseToPostedRide;
import com.gaurav.CarPoolingApplication_SATHI.Exception.InvalidRideStateException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.TooManyRequestException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Repository.PassengerRideRequestRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.RideEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

@Service
@Slf4j
public class PassengerServiceImplementation implements PassengerService {

    // Redis key prefix for user profiles
    private static final String AVAILABLE_RIDES_GLOBAL_CACHE_KEY = "rides:available";
    // Cache TTL (time-to-live) in minutes
    // redis keys for ride request rate limiting
    private static final String RIDE_REQUEST_COUNT_PREFIX = "ride:request:count";
    private static final long MAX_REQUEST_PER_MINUTE = 5;
    // ride requst otp stored into redis
    private static final String RIDE_REQUEST_OTP_PREFIX = "ride:request:user";
    private static final long RIDE_REQUEST_OTP_TTL = 15;
    private static final String ACTIVE_RIDES_REQUESTS_CACHE_PREFIX = "active:rides:requests:";
    // Secure random generator for OTP
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    // ride request updates cache key
    private static final String RIDE_REQUEST_UPDATES_CACHE_KEY = "ride:request:user:updates";
    // ride request updates cache ttl
    private static final long RIDE_REQUEST_UPDATES_CACHE_TTL = 1;
    // available rides ttl
    private static final long CACHE_TTL_MINUTES = 10;
    private final RedisTemplate<String,Object> redisTemplate;
    private final UserEntityRepository userEntityRepository;
    private final RideEntityRepository rideEntityRepository;
    private final PassengerRideRequestRepository passengerRideRequestRepository;
    public PassengerServiceImplementation(
        PassengerRideRequestRepository passengerRideRequestRepository,
        RedisTemplate<String,Object> redisTemplate,
        UserEntityRepository userEntityRepository, RideEntityRepository rideEntityRepository) {
        this.passengerRideRequestRepository = passengerRideRequestRepository;
        this.redisTemplate = redisTemplate;
        this.userEntityRepository = userEntityRepository;
        this.rideEntityRepository = rideEntityRepository;
    }
    // get available rides with caching and proximity filtering support
    @Override
    public List<AvailablePostedRideDTO> getAvailableRides(String email, String city, Double sLat, Double sLng, Double dLat, Double dLng) {
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
        
        // rate limiting
        String countKey = RIDE_REQUEST_COUNT_PREFIX + ":" + email;
        try {
            log.debug("Checking rate limit for user: {}", email);
            Long count = redisTemplate.opsForValue().increment(countKey);
            if (count == null || count > MAX_REQUEST_PER_MINUTE) {
                Long ttl = redisTemplate.getExpire(countKey, TimeUnit.MINUTES);
                long waitMinutes = (ttl != null && ttl > 0) ? ttl : 1;
                log.warn("Rate limit exceeded for user: {}. Current count: {}, TTL: {} min", email, count, waitMinutes);
                throw new TooManyRequestException("Maximum ride request limit reached. Please try again after " + waitMinutes + " minutes.");
            }
            // Set TTL only on first increment to define the 1-minute window
            if(count == 1) this.redisTemplate.expire(countKey, 1, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Redis error during rate limiting for user {}: {}. Proceeding without rate limiting.", email, e.getMessage());
            // Optionally decide if we should block or proceed. For now, proceeding to avoid "no response" hang.
        }

        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> {
                log.error("User not found: {}", email);
                return new UserNotFoundException("User not found.");
            });
        
        validatePassengerAccount(user);
        
        RideEntity rideEntity = this.rideEntityRepository.findById(rideSharingRequestToPostedRide.getRideId())
            .orElseThrow(() -> {
                log.error("Ride not found: {}", rideSharingRequestToPostedRide.getRideId());
                return new InvalidRideStateException("Ride not found.");
            });

        switch (rideEntity.getRideStatus()) {
            case RIDE_CANCELLED:
                throw new InvalidRideStateException("Ride is cancelled.");
            case RIDE_COMPLETED:
                throw new InvalidRideStateException("Ride is completed.");
            case RIDE_FULL:
                throw new InvalidRideStateException("Ride is full.");
            case RIDE_IN_PROGRESS:
                throw new InvalidRideStateException("Ride is in progress.");
            default:
                break;
        }

        if(rideEntity.getRideDepartureTime().isBefore(LocalDateTime.now()))
            throw new InvalidRideStateException("Ride has already started. Please choose a different ride.");
        
        if(rideEntity.getDriverProfileEntity().getUser().getUserId().equals(user.getUserId()))
            throw new AccessDeniedException("You cannot request a ride that you have posted.");

        boolean alreadyRequested = this.passengerRideRequestRepository
                .findByPassengerEntity_UserIdAndRideEntity_RideId(user.getUserId(), rideEntity.getRideId())
                .isPresent();
        if(alreadyRequested)
            throw new InvalidRideStateException("You have already requested this ride. Please check your ride request status for updates.");

        if (rideEntity.getTotalAvailableSeats() < rideSharingRequestToPostedRide.getSeatsRequired())
            throw new InvalidRideStateException(
                "Not enough seats available. Only " +
                rideEntity.getTotalAvailableSeats() + " seat(s) left."
            );
        PassengerRideRequestEntity passengerRideRequestEntity = PassengerRideRequestEntity.builder()
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

        this.passengerRideRequestRepository.save(passengerRideRequestEntity);
        
        // Invalidate the driver's ride request cache for this ride
        this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideEntity.getRideId());
        
        String otp = generateOtp();
        String otpKey = RIDE_REQUEST_OTP_PREFIX + ":" + rideEntity.getRideId() + ":" 
                + passengerRideRequestEntity.getRideRequestId() + ":" + user.getEmail();
        try {
            this.redisTemplate.opsForValue().set(otpKey, otp, RIDE_REQUEST_OTP_TTL, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Failed to save OTP to Redis for rideRequestId {}: {}", passengerRideRequestEntity.getRideRequestId(), e.getMessage());
        }
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
    // get ride request updates
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
        LocalDateTime dayStartedAt = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime dayEndedAt = LocalDateTime.now().toLocalDate().atTime(23, 59, 59);
        List<RideRequestUpdatesDTO> rideRequestUpdates = this.passengerRideRequestRepository.findRideRequestUpdatesByPassengerId(
            userEntity.getUserId(), dayStartedAt, dayEndedAt);
        this.redisTemplate.opsForValue().set(cacheKey, rideRequestUpdates, RIDE_REQUEST_UPDATES_CACHE_TTL, TimeUnit.MINUTES);
        return rideRequestUpdates;
    }
    // helper methods
    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
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
    
}
