package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverAcceptedRideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.PassengerRideBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAcceptedPassengerDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.RideAllBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRateRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.Exception.InvalidRideStateException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoActiveRideFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoEntryFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.TooManyRequestException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.PassengerRideRequestEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideRequestStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRatingEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationType;
import com.gaurav.CarPoolingApplication_SATHI.Repository.DriverEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.PassengerRideRequestRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.RideEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserRatingRepository;
import com.gaurav.CarPoolingApplication_SATHI.Service.Notification.NotificationService;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DriverServiceImplementation implements DriverService {
    // Constants
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final BigDecimal systemCommissionRate = BigDecimal.valueOf(0.1);
    // distance threshold (in km) — if actual vs estimated difference >= this, use actual distance for billing
    private static final BigDecimal DISTANCE_THRESHOLD_KM = BigDecimal.valueOf(0.5);
    // Redis key prefix for user profiles
    private static final String DRIVER_PROFILE_CACHE_PREFIX = "driver:profile:";
    // Cache TTL (time-to-live) in minutes
    private static final long CACHE_TTL_MINUTES = 30;
    private static final String DRIVER_RIDES_CACHE_PREFIX = "driver:rides:";
    private static final String DRIVER_HAS_RIDE_CACHE_PREFIX = "driver:has-active-ride:";
    private static final long RIDES_CACHE_TTL_MINUTES = 10;
    // active rides requests cache keys
    private static final String ACTIVE_RIDES_REQUESTS_CACHE_PREFIX = "active:rides:requests:";
    private static final long ACTIVE_RIDES_REQUESTS_CACHE_TTL_MINUTES = 10;
    // driver accepted rides requests cache keys
    private static final String DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_PREFIX = "driver:accepted:rides:requests:";
    private static final long DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_TTL_MINUTES = 10;
    private static final String RIDE_ACCEPTED_DRIVERS_CACHE_KEY = "ride:accepted:drivers";
    // real time ride update gps cache keys
    private static final String RIDE_GPS_UPDATES_CACHE_KEY = "ride:gps:updates:";
    private static final long RIDE_GPS_UPDATES_CACHE_TTL_MINUTES = 10;
    // storing driver id and ride id so that db don't get overloaded
    private static final String DRIVER_ID_CACHE_KEY = "driver:id:";
    private static final long DRIVER_ID_CACHE_TTL_MINUTES = 30;
    private static final String RIDE_ENTITY_CACHE_KEY = "ride:entity:";
    private static final long RIDE_ENTITY_CACHE_TTL_MINUTES = 30;
    // otp request count cache keys
    private static final String OTP_REQUEST_COUNT_CACHE_KEY = "otp:request:count";
    private static final long OTP_REQUEST_COUNT_CACHE_TTL_MINUTES = 1;

    // Fixed Error 1: Passenger Update Cache Key (Matching PassengerServiceImplementation)
    private static final String RIDE_REQUEST_UPDATES_CACHE_KEY = "ride:request:user:updates";
    private static final String PASSENGER_RIDE_HISTORY_CACHE_KEY = "passenger_ride_history";
    
    private final UserRatingRepository userRatingRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserEntityRepository userEntityRepository;
    private final DriverEntityRepository driverEntityRepository;
    private final RideEntityRepository rideEntityRepository;
    private final PassengerRideRequestRepository passengerRideRequestRepository;
    private final NotificationService notificationService;
    public DriverServiceImplementation(
            UserRatingRepository userRatingRepository,
            PassengerRideRequestRepository passengerRideRequestRepository,
            UserEntityRepository userEntityRepository,
            RedisTemplate<String, Object> redisTemplate,
            DriverEntityRepository driverEntityRepository,
            RideEntityRepository rideEntityRepository,
            NotificationService notificationService) {
        this.userRatingRepository = userRatingRepository;
        this.redisTemplate = redisTemplate;
        this.driverEntityRepository = driverEntityRepository;
        this.userEntityRepository = userEntityRepository;
        this.rideEntityRepository = rideEntityRepository;
        this.passengerRideRequestRepository = passengerRideRequestRepository;
        this.notificationService = notificationService;
    }

    // get driver profile
    @Override
    @Transactional
    public DriverProfileDTO getDriverProfile(String email) {
        // Check cache first
        String cacheKey = DRIVER_PROFILE_CACHE_PREFIX + email;
        DriverProfileDTO cachedProfile = (DriverProfileDTO) redisTemplate.opsForValue().get(cacheKey);
        if (cachedProfile != null)
            return cachedProfile;
        UserEntity user = this.userEntityRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found."));
        this.validateUserAccount(user);
        DriverProfileDTO profile = this.driverEntityRepository.findDriverProfileByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver profile not found."));
        if (profile.getAverageRating() == null)
            profile.setAverageRating(0.0);
        if (profile.getTotalRatingsCount() == null)
            profile.setTotalRatingsCount(0);
        redisTemplate.opsForValue().set(cacheKey, profile, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        log.info("Driver profile fetched for: {}", email);
        return profile;
    }

    // update driver profile
    @Override
    @Transactional
    public DriverProfileDTO updateDriverProfile(String email, UpdateDriverProfileRequest request) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccount(user);
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver profile not found."));
        if (request.getLicenseExpirationDate() != null) {
            if (request.getLicenseExpirationDate().isBefore(LocalDate.now()))
                throw new IllegalArgumentException("Licence already expired.");
            driverProfileEntity.setLicenseExpirationDate(request.getLicenseExpirationDate());
        }
        if (request.getVehicleModel() != null && !request.getVehicleModel().isEmpty())
            driverProfileEntity.setVehicleModel(request.getVehicleModel());
        if (request.getVehicleNumber() != null && !request.getVehicleNumber().isEmpty()) {
            Optional<DriverProfileEntity> profile = this.driverEntityRepository
                    .findByVehicleNumber(request.getVehicleNumber());
            if (profile.isPresent()
                    && !profile.get().getDriverProfileId().equals(driverProfileEntity.getDriverProfileId()))
                throw new IllegalArgumentException("Vehicle number already registered.");
            driverProfileEntity.setVehicleNumber(request.getVehicleNumber());
        }
        if (request.getVehicleSeatCapacity() != null && request.getVehicleSeatCapacity() > 0)
            driverProfileEntity.setVehicleSeatCapacity(request.getVehicleSeatCapacity());
        if (request.getVehicleCategory() != null && !request.getVehicleCategory().isEmpty()) {
            driverProfileEntity.setVehicleCategory(parseEnum(VehicleCategory.class, request.getVehicleCategory()));
        }
        if (request.getVehicleClass() != null && !request.getVehicleClass().isEmpty()) {
            driverProfileEntity.setVehicleClass(parseEnum(VehicleClass.class, request.getVehicleClass()));
        }
        driverProfileEntity.setUpdatedAt(LocalDateTime.now());
        this.driverEntityRepository.save(driverProfileEntity);
        this.redisTemplate.delete(DRIVER_PROFILE_CACHE_PREFIX + email);
        return this.getDriverProfile(email);
    }

    // change driver availability status
    @Override
    @Transactional
    public String changeDriverAvailabilityStatus(String email, String driverAvailabilityStatus) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccount(user);
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver profile not found."));
        if (driverAvailabilityStatus != null && !driverAvailabilityStatus.isEmpty()) {
            driverProfileEntity
                    .setDriverAvailabilityStatus(parseEnum(DriverAvailabilityStatus.class, driverAvailabilityStatus));
        }
        driverProfileEntity.setUpdatedAt(LocalDateTime.now());
        this.driverEntityRepository.save(driverProfileEntity);
        this.redisTemplate.delete(DRIVER_PROFILE_CACHE_PREFIX + email);
        return "Driver availability status changed to " + driverProfileEntity.getDriverAvailabilityStatus().toString();
    }

    // post ride
    @Override
    @Transactional
    public RidePostResponseDTO postRide(String email, RideRequestDTO rideRequestDTO) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        UserEntity user = driverProfileEntity.getUser();
        this.validateUserAccount(user);
        if (driverProfileEntity.getDriverAvailabilityStatus() == DriverAvailabilityStatus.NOT_AVAILABLE ||
                driverProfileEntity.getDriverAvailabilityStatus() == DriverAvailabilityStatus.OFF_DUTY)
            throw new IllegalArgumentException("Driver is not available to post a ride. "
                    + "Please change your availability status to AVAILABLE.");
        LocalDateTime rideDeparturDateTime = rideRequestDTO.getDepartureTime();
        if(rideDeparturDateTime.isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("Ride departure time cannot be in the past.");
        if(rideDeparturDateTime.isAfter(LocalDateTime.now().plusDays(7)))
            throw new IllegalArgumentException("Ride departure time cannot be more than 7 days from now."+
                " Please post ride within 7 days.");
                
        // 1. Anti-spam / Duplicate Route check (1-hour tight window for same route)
        boolean isDuplicateRoute = this.rideEntityRepository.existsDuplicatePostedRide(
                driverProfileEntity,
                rideDeparturDateTime.minusHours(1),
                rideDeparturDateTime.plusHours(1),
                rideRequestDTO.getSourceLat(),
                rideRequestDTO.getSourceLong(),
                rideRequestDTO.getDestinationLat(),
                rideRequestDTO.getDestinationLong(),
                0.05 
        );
        if (isDuplicateRoute) {
            throw new IllegalArgumentException("You have already posted a similar ride for this route near this departure time. Please manage your existing ride instead.");
        }

        // 2. Global Conflict Check (2-hour window for ANY ride)
        boolean hasConflict = this.rideEntityRepository.existsConflictingRide(
                driverProfileEntity,
                rideDeparturDateTime.minusHours(2),
                rideDeparturDateTime.plusHours(2)
        );
        if (hasConflict) {
            throw new IllegalArgumentException("Overlap Detected: You already have another ride scheduled within 2 hours of this departure time. Please ensure your rides do not overlap.");
        }

        // service-level logic)
        if (rideRequestDTO.getAvailableSeats() > driverProfileEntity.getVehicleSeatCapacity())
            throw new IllegalArgumentException("Available seats (" + rideRequestDTO.getAvailableSeats() +
                    ") exceed vehicle capacity (" + driverProfileEntity.getVehicleSeatCapacity() + ").");

        // 2. Calculate Distance and Fare
        double distance;
        if (rideRequestDTO.getTotalDistanceKm() != null && rideRequestDTO.getTotalDistanceKm() > 0) {
            distance = rideRequestDTO.getTotalDistanceKm();
            log.info("Using road distance from frontend: {} km", distance);
        } else {
            distance = calculateDistanceByHaverSineFormula(
                    rideRequestDTO.getSourceLat(), rideRequestDTO.getSourceLong(),
                    rideRequestDTO.getDestinationLat(), rideRequestDTO.getDestinationLong());
            log.info("Using straight-line fallback distance: {} km", distance);
        }

        BigDecimal distanceBD = BigDecimal.valueOf(distance);
        BigDecimal farePerKm = distanceBD.multiply(rideRequestDTO.getPricePerKm());
        BigDecimal baseFare = calculateBaseFareOfRide(driverProfileEntity.getVehicleClass(),
                driverProfileEntity.getVehicleCategory());
        BigDecimal estimatedFare = baseFare.add(farePerKm);
        BigDecimal systemCommission = estimatedFare.multiply(systemCommissionRate);
        // BigDecimal totalDriverShare will be implemented in the complete ride method
        RideEntity rideEntity = RideEntity.builder()
                .driverProfileEntity(driverProfileEntity)
                .sourceLat(rideRequestDTO.getSourceLat())
                .sourceLng(rideRequestDTO.getSourceLong())
                .sourceAddress(rideRequestDTO.getBoardingAddress())
                .destinationLat(rideRequestDTO.getDestinationLat())
                .destinationLng(rideRequestDTO.getDestinationLong())
                .destinationAddress(rideRequestDTO.getDestinationAddress())
                .vehicleClass(driverProfileEntity.getVehicleClass())
                .vehicleCategory(driverProfileEntity.getVehicleCategory())
                .rideStatus(RideStatus.RIDE_POSTED)
                .estimatedDistanceOfRide(distanceBD.setScale(2, java.math.RoundingMode.HALF_UP))
                .actualDistanceOfRide(distanceBD.setScale(2, java.math.RoundingMode.HALF_UP))
                .baseFare(baseFare.setScale(2, java.math.RoundingMode.HALF_UP))
                .pricePerKm(rideRequestDTO.getPricePerKm())
                .estimatedFare(estimatedFare.setScale(2, java.math.RoundingMode.HALF_UP))
                .systemCommission(systemCommission.setScale(2, java.math.RoundingMode.HALF_UP))
                .totalDriverShare(BigDecimal.ZERO)
                .actualFare(BigDecimal.ZERO)
                .totalAvailableSeats(rideRequestDTO.getAvailableSeats())
                .offeredSeats(driverProfileEntity.getVehicleSeatCapacity())
                .totalPassengersSharedRide(0)
                .rideDepartureTime(rideRequestDTO.getDepartureTime())
                .rideCompletiontime(null)
                .rideCreatedAt(LocalDateTime.now())
                .rideUpdatedAt(LocalDateTime.now())
                .routePath(rideRequestDTO.getRoutePath())
                .build();
        this.rideEntityRepository.save(rideEntity);
        // 4. Invalidate Cache
        this.redisTemplate.delete(DRIVER_RIDES_CACHE_PREFIX + email);
        this.redisTemplate.delete(DRIVER_HAS_RIDE_CACHE_PREFIX + email);
        // Invalidate ALL available rides caches (global + all city-specific)
        // The extractCity method can't reliably parse the city from varied address
        // formats,
        // so we wipe all rides:available* keys to guarantee passengers see the latest
        // rides.
        // Ride posting is infrequent, so this has negligible performance impact.
        java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
        if (availableRideKeys != null && !availableRideKeys.isEmpty()) {
            this.redisTemplate.delete(availableRideKeys);
            log.info("Invalidated {} available rides cache keys", availableRideKeys.size());
        }
        // 5. Return Mapped Response
        log.info("Ride posted successfully.");
        return mapRideEntityToRidePostResponseDTO(rideEntity);
    }

    // check if ride is posted by driver
    @Override
    public List<DriverPostedRides> getActiveRideForDriver(String email) {
        // Check Cache
        String cacheKey = DRIVER_RIDES_CACHE_PREFIX + email;
        @SuppressWarnings("unchecked")
        List<DriverPostedRides> cachedRides = (List<DriverPostedRides>) this.redisTemplate.opsForValue().get(cacheKey);
        if (cachedRides != null) {
            log.info("Active rides fetched from cache for: {}", email);
            return cachedRides;
        }
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());
        List<DriverPostedRides> activeRide = this.rideEntityRepository.findFirstActiveRide(
                driverProfileEntity,
                Arrays.asList(RideStatus.RIDE_POSTED, RideStatus.RIDE_STARTED, RideStatus.RIDE_IN_PROGRESS),
                LocalDateTime.now());
        if (activeRide == null || activeRide.isEmpty())
            throw new NoActiveRideFoundException("No active ride found.");
        // Save to Cache
        this.redisTemplate.opsForValue().set(cacheKey, activeRide, RIDES_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        log.info("Active rides fetched from DB and cached for: {}", email);
        return activeRide;
    }

    // check if driver has any active ride
    @Override
    public Boolean hasActiveRide(String email) {
        String cacheKey = DRIVER_HAS_RIDE_CACHE_PREFIX + email;
        Boolean hasRide = (Boolean) this.redisTemplate.opsForValue().get(cacheKey);
        if (hasRide != null)
            return hasRide;

        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());

        hasRide = this.rideEntityRepository.existsActiveRide(
                driverProfileEntity,
                Arrays.asList(RideStatus.RIDE_POSTED, RideStatus.RIDE_STARTED, RideStatus.RIDE_IN_PROGRESS),
                LocalDateTime.now());

        this.redisTemplate.opsForValue().set(cacheKey, hasRide, RIDES_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        return hasRide;
    }

    // map RideEntity to RidePostResponseDTO
    private RidePostResponseDTO mapRideEntityToRidePostResponseDTO(RideEntity rideEntity) {
        RidePostResponseDTO response = new RidePostResponseDTO();
        response.setRideId(rideEntity.getRideId());
        response.setDriverName(rideEntity.getDriverProfileEntity().getUser().getUserFullName());
        response.setSourceLat(rideEntity.getSourceLat());
        response.setSourceLong(rideEntity.getSourceLng());
        response.setBoardingAddress(rideEntity.getSourceAddress());
        response.setDestinationLat(rideEntity.getDestinationLat());
        response.setDestinationLong(rideEntity.getDestinationLng());
        response.setDestinationAddress(rideEntity.getDestinationAddress());
        response.setDepartureTime(rideEntity.getRideDepartureTime());
        response.setAvailableSeats(rideEntity.getTotalAvailableSeats());
        response.setBasePrice(rideEntity.getBaseFare());
        response.setPricePerKm(rideEntity.getPricePerKm());
        response.setEstimatedTotalDistance(rideEntity.getEstimatedDistanceOfRide());
        response.setEstimatedRideFare(rideEntity.getEstimatedFare());
        response.setRoutePath(rideEntity.getRoutePath());
        return response;
    }

    // get driver's posted rides requests (Unified view of Pending and Accepted)
    @Override
    @Transactional
    public RideAllBookingRequestsDTO getMyPostedRidesRequests(String email, Long rideId) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());
        String cacheKey = ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified";
        RideAllBookingRequestsDTO cachedResponse = (RideAllBookingRequestsDTO) this.redisTemplate
                .opsForValue().get(cacheKey);
        if (cachedResponse != null)
            return cachedResponse;
        // Fetch the ride entity to verify ownership
        RideEntity rideEntity = this.rideEntityRepository.findById(rideId)
                .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        if (!Objects.equals(rideEntity.getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new AccessDeniedException("You are not authorized to access this ride.");

        LocalDateTime startWindow = LocalDateTime.now().minusWeeks(1);
        LocalDateTime endWindow = LocalDateTime.now().plusWeeks(1);
        // 1. Fetch all Pending requests
        List<PassengerRideBookingRequestsDTO> pendingRequests = this.passengerRideRequestRepository
                .findPassengerRideBookingRequestsByDriverId(
                        driverProfileEntity.getUser().getUserId(), rideId, startWindow, endWindow);

        // 2. Fetch all Accepted passengers
        List<DriverAcceptedRideRequestDTO> acceptedPassengers = this.passengerRideRequestRepository
                .findDriverAcceptedRideRequestsByDriverId(
                        driverProfileEntity.getUser().getUserId(), rideId, startWindow, endWindow);

        RideAllBookingRequestsDTO response = RideAllBookingRequestsDTO.builder()
                .pendingRequests(pendingRequests)
                .acceptedPassengers(acceptedPassengers)
                .build();

        // Cache the combined response
        this.redisTemplate.opsForValue().set(cacheKey, response, ACTIVE_RIDES_REQUESTS_CACHE_TTL_MINUTES,
                TimeUnit.MINUTES);
        
        return response;
    }

    // accept ride request
    @Override
    @Transactional
    public String acceptRideRequest(String email, Long rideId, Long rideRequestId) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());

        PassengerRideRequestEntity passengerRideRequestEntity = this.passengerRideRequestRepository
            .findById(rideRequestId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));
        
        // 1. GLOBAL CHECK: Is this passenger already booked within a 1-hour conflict window?
        Long passengerId = passengerRideRequestEntity.getPassengerEntity().getUserId();
        LocalDateTime rideTime = passengerRideRequestEntity.getRideEntity().getRideDepartureTime();
        LocalDateTime windowStart = rideTime.minusHours(1);
        LocalDateTime windowEnd = rideTime.plusHours(1);
        
        boolean hasConflict = this.passengerRideRequestRepository
            .hasOverlappingAcceptedRide(passengerId, windowStart, windowEnd);
        
        if(hasConflict) {
            // Refresh this driver's dashboard just in case it was stale
            this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified");
            throw new InvalidRideStateException("This passenger is already booked on another ride during this time window."); 
        }

        RideEntity rideEntity = this.rideEntityRepository.findById(rideId)
            .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        if (!Objects.equals(rideEntity.getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new NoEntryFoundException("You are not authorized to access this ride.");
        if (!Objects.equals(passengerRideRequestEntity.getRideEntity().getRideId(), rideId))
            throw new NoEntryFoundException("Ride request not found.");
        if (!Objects.equals(passengerRideRequestEntity.getRideEntity().getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new NoEntryFoundException("You are not authorized to access this ride.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.ACCEPTED))
            throw new NoEntryFoundException("Ride request already accepted.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.REJECTED))
            throw new NoEntryFoundException("Ride request already rejected.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.CANCELLED))
            throw new NoEntryFoundException("Ride request already cancelled.");
        // Seat Validation
        if (rideEntity.getTotalAvailableSeats() < passengerRideRequestEntity.getRequestedSeats()) {
            throw new InvalidRideStateException("Not enough seats available to accept this request. Available: " 
                + rideEntity.getTotalAvailableSeats() + ", Requested: " + passengerRideRequestEntity.getRequestedSeats());
        }
        try{
            // Update Request Status
            passengerRideRequestEntity.setRideRequestStatus(RideRequestStatus.ACCEPTED);
            passengerRideRequestEntity.setRideAcceptedAt(LocalDateTime.now());
            
            // Update Ride Seats correctly
            rideEntity.setTotalAvailableSeats(rideEntity.getTotalAvailableSeats() - passengerRideRequestEntity.getRequestedSeats());
            rideEntity.setTotalPassengersSharedRide(rideEntity.getTotalPassengersSharedRide() + 1);
            
            // Check for RIDE_FULL status
            if (rideEntity.getTotalAvailableSeats() == 0) {
                rideEntity.setRideStatus(RideStatus.RIDE_FULL);
                log.info("Ride ID: {} is now FULL.", rideId);
            }
            this.rideEntityRepository.save(rideEntity);
            this.passengerRideRequestRepository.save(passengerRideRequestEntity);
            this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified");
            
            log.info("Ride request ID: {} accepted for ride ID: {}. Remaining seats: {}", 
                rideRequestId, rideId, rideEntity.getTotalAvailableSeats());

            // Notify Passenger
            notificationService.createNotification(
                passengerRideRequestEntity.getPassengerEntity(),
                String.format("Your request for the ride from %s to %s has been ACCEPTED by %s", 
                    rideEntity.getSourceAddress(), rideEntity.getDestinationAddress(), rideEntity.getDriverProfileEntity().getUser().getUserFullName()),
                NotificationType.RIDE_ACCEPTED,
                rideRequestId
            );

            // 1. CLEANUP: Cancel all other pending requests for this passenger within the same time window
            List<PassengerRideRequestEntity> otherRequests = this.passengerRideRequestRepository
                .findOverlappingPendingRequests(
                    passengerId, rideRequestId, windowStart, windowEnd);
            java.util.Set<Long> affectedRideIds = new java.util.HashSet<>();
            affectedRideIds.add(rideId); // Current ride
            if (!otherRequests.isEmpty()) {
                log.info("Cleaning up {} other pending requests for passenger ID: {}", otherRequests.size(), passengerId);
                for (PassengerRideRequestEntity other : otherRequests) {
                    other.setRideRequestStatus(RideRequestStatus.CANCELLED);
                    other.setRideCancelledAt(LocalDateTime.now());
                    affectedRideIds.add(other.getRideEntity().getRideId());
                    // Notify Passenger that their other pending request was auto-cancelled due to this acceptance
                    notificationService.createNotification(
                        other.getPassengerEntity(),
                        String.format("Your pending request for the ride from %s to %s was cancelled because you were accepted on another ride.", 
                            other.getRideEntity().getSourceAddress(), other.getRideEntity().getDestinationAddress()),
                        NotificationType.RIDE_CANCELLED,
                        other.getRideRequestId()
                    );
                }
                this.passengerRideRequestRepository.saveAll(otherRequests);
            }
            // 2. CACHE INVALIDATION: for all affected rides
            for (Long affectedRideId : affectedRideIds) 
                this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + affectedRideId + ":unified");
            // 3. Invalidate Driver's own ride list cache (totalAvailableSeats updated)
            this.redisTemplate.delete(DRIVER_RIDES_CACHE_PREFIX + email);
            // 4. Invalidate "Accepted Passengers" cache (so driver sees the new passenger)
            this.redisTemplate.delete(DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_PREFIX + driverProfileEntity.getUser().getUserId() + ":" + rideId + ":unified");
            // 5. Invalidate "Accepted Drivers" cache (so passenger sees the driver's phone)
            this.redisTemplate.delete(RIDE_ACCEPTED_DRIVERS_CACHE_KEY + ":" + passengerId + ":" + rideRequestId);
            
            // 6. Fix for Error 1: Invalidate Passenger's Update List cache (so they see ACCEPTED instantly)
            String passengerEmail = passengerRideRequestEntity.getPassengerEntity().getEmail();
            this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passengerEmail);

            // 7. Invalidate ALL available rides caches for passengers (seat counts changed)
            java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
            if (availableRideKeys != null && !availableRideKeys.isEmpty()) 
                this.redisTemplate.delete(availableRideKeys);
            return "Ride request accepted successfully.";
        }catch(InvalidRideStateException e) {
            throw e;
        }catch(Exception e){
            log.error("Error accepting ride request ID: {}: {}", rideRequestId, e.getMessage());
            throw new RuntimeException("Failed to accept ride request.");
        }
    }
    // reject ride request
    @Override
    @Transactional
    public String rejectRideRequest(String email, Long rideId, Long rideRequestId) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());
        RideEntity rideEntity = this.rideEntityRepository.findById(rideId)
            .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        if (!Objects.equals(rideEntity.getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new NoEntryFoundException("You are not authorized to access this ride.");
        PassengerRideRequestEntity passengerRideRequestEntity = this.passengerRideRequestRepository.findById(rideRequestId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));
        if (!Objects.equals(passengerRideRequestEntity.getRideEntity().getRideId(), rideId))
            throw new NoEntryFoundException("Ride request not found.");
        if (!Objects.equals(passengerRideRequestEntity.getRideEntity().getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new NoEntryFoundException("You are not authorized to access this ride.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.ACCEPTED))
            throw new NoEntryFoundException("Ride request already accepted.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.REJECTED))
            throw new NoEntryFoundException("Ride request already rejected.");
        if(Objects.equals(passengerRideRequestEntity.getRideRequestStatus(), RideRequestStatus.CANCELLED))
            throw new NoEntryFoundException("Ride request already cancelled.");
        try{
            passengerRideRequestEntity.setRideRequestStatus(RideRequestStatus.REJECTED);
            passengerRideRequestEntity.setRideRejectedAt(LocalDateTime.now());
            int currentCount = passengerRideRequestEntity.getRejectionCount() == null ? 0 : passengerRideRequestEntity.getRejectionCount();
            passengerRideRequestEntity.setRejectionCount(currentCount + 1);
            this.passengerRideRequestRepository.save(passengerRideRequestEntity);
            log.info("Ride request ID: {} rejected for ride ID: {}", rideRequestId, rideId);

            // Notify Passenger
            notificationService.createNotification(
                passengerRideRequestEntity.getPassengerEntity(),
                String.format("Your request for the ride from %s to %s was REJECTED by the driver.", 
                    rideEntity.getSourceAddress(), rideEntity.getDestinationAddress()),
                NotificationType.RIDE_REJECTED,
                rideRequestId
            );
            this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified");
            
            // Invalidate Available Rides Cache (just to be safe, though seats didn't change, 
            // some statuses might depend on it)
            java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
            if (availableRideKeys != null && !availableRideKeys.isEmpty()) {
                this.redisTemplate.delete(availableRideKeys);
            }

            // Fix for Error 1: Invalidate Passenger's Update List cache (so they see REJECTED instantly)
            String passengerEmail = passengerRideRequestEntity.getPassengerEntity().getEmail();
            this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passengerEmail);
            this.redisTemplate.delete(PASSENGER_RIDE_HISTORY_CACHE_KEY + ":" + passengerRideRequestEntity.getPassengerEntity().getUserId());

            return "Ride request rejected successfully.";
        }catch(Exception e){
            throw new RuntimeException("Failed to reject ride request.");
        }
    }
    // ride accepted passenger DTOs (to communicate with passenger)
    @SuppressWarnings("unchecked")
    @Override
    public List<RideAcceptedPassengerDTO> getRideAcceptedPassengers(String email, Long rideId) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        UserEntity user = driverProfileEntity.getUser();
        validateUserAccount(user);
        String cacheKey = DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_PREFIX + user.getUserId() + ":" + rideId + ":unified";
        try {
            List<RideAcceptedPassengerDTO> cached = (List<RideAcceptedPassengerDTO>) this.redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) 
                return cached;
        } catch (Exception e) {
            log.error("Error getting ride accepted passengers from cache for ride {}: {}", rideId, e.getMessage());
            throw new RuntimeException("Failed to get ride accepted passengers.");
        }
        boolean isDriverOwnRide = this.rideEntityRepository.findByRideIdAndDriverProfileEntity(rideId, driverProfileEntity).isPresent();
        if (!isDriverOwnRide)
            throw new AccessDeniedException("You are not authorized to access this ride.");
        LocalDateTime startWindow = LocalDateTime.now().minusWeeks(1);
        LocalDateTime endWindow = LocalDateTime.now().plusWeeks(1);
        List<RideAcceptedPassengerDTO> rideAcceptedPassengerDTOs = this.passengerRideRequestRepository.findRideAcceptedPassengersByDriverId(
            user.getUserId(), 
            rideId, 
            startWindow, 
            endWindow
        );
        try {
            this.redisTemplate.opsForValue().set(
                cacheKey, 
                rideAcceptedPassengerDTOs, 
                DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_TTL_MINUTES, 
                TimeUnit.MINUTES
            );
        } catch (Exception e) {
            log.error("Error setting ride accepted passengers in cache for ride {}: {}", rideId, e.getMessage());
        }
        return rideAcceptedPassengerDTOs;
    }
    // start ride method (for tracking ride)
    @Override
    public void startRide(String email, Long rideId) {
        DriverProfileEntity driverProfile = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        UserEntity user = driverProfile.getUser();
        validateUserAccount(user);

        // Enforce singular active ride rule
        boolean existsInProgressRide = this.rideEntityRepository.existsInProgressRide(driverProfile.getDriverProfileId());
        if (existsInProgressRide) {
            throw new InvalidRideStateException("You have already started a ride. Please complete or cancel it before starting another.");
        }

        RideEntity rideEntity = this.rideEntityRepository.findByRideIdAndDriverProfileEntity(rideId, driverProfile)
            .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        
        if (rideEntity.getRideStatus() != RideStatus.RIDE_POSTED) {
            throw new InvalidRideStateException("Only posted rides can be started.");
        }

        rideEntity.setRideStatus(RideStatus.RIDE_IN_PROGRESS);
        rideEntity.setRideStartedAt(LocalDateTime.now());

        // Notify Passengers 
        // Currently, notificationService.createNotification persists the notification to the DB.
        // The passenger's mobile/web app fetches these via the /notifications endpoint (Polling/Initial fetch).
        // For real-time delivery, a WebSocket or FCM integration could be added here.
        List<PassengerRideRequestEntity> acceptedRequests = this.passengerRideRequestRepository
                .findByRideEntity_RideIdAndRideRequestStatus(rideId, RideRequestStatus.ACCEPTED);

        for (PassengerRideRequestEntity request : acceptedRequests) {
            notificationService.createNotification(
                    request.getPassengerEntity(),
                    String.format("The driver %s has started your ride from %s to %s. Please be ready for pickup.",
                            user.getUserFullName(), rideEntity.getSourceAddress(), rideEntity.getDestinationAddress()),
                    NotificationType.RIDE_STARTED,
                    request.getRideRequestId());
        }

        // Cache the ride state for fast GPS lookup
        String rideCacheKey = RIDE_ENTITY_CACHE_KEY + ":" + rideId;
        this.redisTemplate.opsForValue().set(rideCacheKey, mapToRideCacheDTO(rideEntity), RIDE_ENTITY_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        
        this.rideEntityRepository.save(rideEntity);
        log.info("Ride ID: {} started by driver. notified {} passengers.", rideId, acceptedRequests.size());
    }
    // cancel ride
    @Override
    @Transactional
    public void cancelRide(String email, Long rideId) {
        DriverProfileEntity driverProfle = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        UserEntity user = driverProfle.getUser();
        validateUserAccount(user);
        RideEntity rideEntity = this.rideEntityRepository
            .findByRideIdAndDriverProfileEntity_DriverProfileId(rideId, driverProfle.getDriverProfileId())
            .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        if(!(rideEntity.getRideStatus() == RideStatus.RIDE_POSTED || 
            rideEntity.getRideStatus() == RideStatus.RIDE_IN_PROGRESS || 
            rideEntity.getRideStatus() == RideStatus.RIDE_STARTED))
            throw new InvalidRideStateException("Ride cannot be cancelled. Only posted, in progress or started rides can be cancelled.");
        List<PassengerRideRequestEntity> passengerRideRequests = this.passengerRideRequestRepository
            .findByRideEntity_RideIdAndRideRequestStatus(rideId, RideRequestStatus.ACCEPTED);
        for (PassengerRideRequestEntity request : passengerRideRequests) {
            request.setRideRequestStatus(RideRequestStatus.CANCELLED);
            this.passengerRideRequestRepository.save(request);
            notificationService.createNotification(
                request.getPassengerEntity(),
                String.format("The driver %s has cancelled your ride from %s to %s. Please find another ride.",
                        user.getUserFullName(), rideEntity.getSourceAddress(), rideEntity.getDestinationAddress()),
                NotificationType.RIDE_CANCELLED,
                request.getRideRequestId());
        }
        rideEntity.setRideStatus(RideStatus.RIDE_CANCELLED);
        rideEntity.setRideUpdatedAt(LocalDateTime.now());
        this.rideEntityRepository.save(rideEntity);
        log.info("Ride ID: {} cancelled by driver.", rideId);

        // 3. Cache Invalidation
        this.redisTemplate.delete(DRIVER_RIDES_CACHE_PREFIX + email);
        this.redisTemplate.delete(DRIVER_HAS_RIDE_CACHE_PREFIX + email);
        this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified");
        
        // Invalidate Available Rides Cache (though this was in-progress, 
        // cleaning up global caches is safe)
        java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
        if (availableRideKeys != null && !availableRideKeys.isEmpty()) {
            this.redisTemplate.delete(availableRideKeys);
        }
    }
    // real time ride GPS updates tracking
    @Transactional
    @Override
    public void updateRideGPS(String email, RideGPSUpdatesDTO rideGPSUpdatesDTO) {
        String driverProfileIdCacheKey = DRIVER_ID_CACHE_KEY + ":" + email;
        Object cachedValue = this.redisTemplate.opsForValue().get(driverProfileIdCacheKey);
        
        // Defensive cast: Handling Redis Integer vs Long
        Long driverProfileId = (cachedValue == null) ? null : ((Number) cachedValue).longValue();

        if (driverProfileId == null) {
            DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
            driverProfileId = driverProfileEntity.getDriverProfileId();
            this.redisTemplate.opsForValue().set(driverProfileIdCacheKey, driverProfileId, DRIVER_ID_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        }
        String rideEntityCacheKey = RIDE_ENTITY_CACHE_KEY + ":" + rideGPSUpdatesDTO.getRideId();
        Object cachedRide = this.redisTemplate.opsForValue().get(rideEntityCacheKey);
        RideCacheDTO rideCacheDTO = null;

        if (cachedRide instanceof RideCacheDTO) {
            rideCacheDTO = (RideCacheDTO) cachedRide;
        } else if (cachedRide instanceof java.util.Map) {
            // Robust fallback for Jackson deserialization into Map
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) cachedRide;
            rideCacheDTO = RideCacheDTO.builder()
                .rideId(((Number) map.get("rideId")).longValue())
                .driverProfileId(((Number) map.get("driverProfileId")).longValue())
                .rideStatus(RideStatus.valueOf((String) map.get("rideStatus")))
                .build();
        }

        if(rideCacheDTO == null) {
            RideEntity rideEntity = this.rideEntityRepository.findById(rideGPSUpdatesDTO.getRideId())
                .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
            rideCacheDTO = mapToRideCacheDTO(rideEntity);
            this.redisTemplate.opsForValue().set(rideEntityCacheKey, rideCacheDTO, RIDE_ENTITY_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        }

        // Authorization & State validation
        if (!rideCacheDTO.getDriverProfileId().equals(driverProfileId)) {
            throw new AccessDeniedException("You are not authorized to update GPS for this ride.");
        }
        if (rideCacheDTO.getRideStatus() != RideStatus.RIDE_IN_PROGRESS) {
            throw new InvalidRideStateException("Tracking is only available for rides in progress.");
        }

        // Distance Accumulator: Calculate incremental distance from the previous GPS point
        String rideGPSUpdatesCacheKey = RIDE_GPS_UPDATES_CACHE_KEY + ":" + rideGPSUpdatesDTO.getRideId();
        Object previousGPSObj = this.redisTemplate.opsForValue().get(rideGPSUpdatesCacheKey);
        double previousTotalDistance = 0.0;

        if (previousGPSObj instanceof RideGPSUpdatesDTO previousGPS) {
            if (previousGPS.getLatitude() != null && previousGPS.getLongitude() != null) {
                double incrementalDistance = calculateDistanceByHaverSineFormula(
                    previousGPS.getLatitude(), previousGPS.getLongitude(),
                    rideGPSUpdatesDTO.getLatitude(), rideGPSUpdatesDTO.getLongitude()
                );
                previousTotalDistance = (previousGPS.getTotalDistanceTraveled() != null)
                    ? previousGPS.getTotalDistanceTraveled() : 0.0;
                previousTotalDistance += incrementalDistance;
            }
        } else if (previousGPSObj instanceof java.util.Map) {
            // Robust fallback for Jackson deserialization into Map
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) previousGPSObj;
            Double prevLat = map.get("latitude") != null ? ((Number) map.get("latitude")).doubleValue() : null;
            Double prevLng = map.get("longitude") != null ? ((Number) map.get("longitude")).doubleValue() : null;
            if (prevLat != null && prevLng != null) {
                double incrementalDistance = calculateDistanceByHaverSineFormula(
                    prevLat, prevLng,
                    rideGPSUpdatesDTO.getLatitude(), rideGPSUpdatesDTO.getLongitude()
                );
                previousTotalDistance = map.get("totalDistanceTraveled") != null
                    ? ((Number) map.get("totalDistanceTraveled")).doubleValue() : 0.0;
                previousTotalDistance += incrementalDistance;
            }
        }

        rideGPSUpdatesDTO.setTotalDistanceTraveled(previousTotalDistance);
        this.redisTemplate.opsForValue().set(rideGPSUpdatesCacheKey, rideGPSUpdatesDTO, RIDE_GPS_UPDATES_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
    }
    // reached passenger pickup
    @Override
    @Transactional
    public void reachedPassengerPickUp(String email, Long rideId, Long rideReqeustId) {
        String otpRequestCountKey = OTP_REQUEST_COUNT_CACHE_KEY + ":" + rideId + ":" + rideReqeustId;
        
        // Robust Rate Limiting: Set TTL on the very first increment
        Long count = this.redisTemplate.opsForValue().increment(otpRequestCountKey);
        if (count != null && count == 1) 
            this.redisTemplate.expire(otpRequestCountKey, OTP_REQUEST_COUNT_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        if (count != null && count > 3) {
            long remainingTime = this.redisTemplate.getExpire(otpRequestCountKey, TimeUnit.MINUTES);
            long timeToShow = (remainingTime > 0) ? remainingTime : OTP_REQUEST_COUNT_CACHE_TTL_MINUTES;
            throw new TooManyRequestException("OTP request limit exceeded. Please try again in " + timeToShow + " minutes.");
        }

        DriverProfileEntity driver = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        UserEntity user = driver.getUser();
        validateUserAccount(user);
        PassengerRideRequestEntity rideReqeustEntity = this.passengerRideRequestRepository
            .findByRideEntity_RideIdAndRideRequestId(rideId, rideReqeustId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));

        // Safety Lock: Prevent duplicate arrival notifications if already onboard or completed
        if (rideReqeustEntity.getRideRequestStatus() == RideRequestStatus.ONBOARDED || 
            rideReqeustEntity.getRideRequestStatus() == RideRequestStatus.COMPLETED) {
            throw new InvalidRideStateException("Action blocked: Passenger is already onboard or ride is completed.");
        }
        String otp = generateOtp();
        rideReqeustEntity.setOtp(otp);
        rideReqeustEntity.setIsDriverReachedPickupLocation(true);
        rideReqeustEntity.setRideRequestStatus(RideRequestStatus.DRIVER_REACHED_PICKUP_LOCATION);
        this.passengerRideRequestRepository.save(rideReqeustEntity);
        this.redisTemplate.opsForValue().set(otpRequestCountKey, 0, OTP_REQUEST_COUNT_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        notificationService.createNotification(
            rideReqeustEntity.getPassengerEntity(),
            "OTP send successfully for the ride " + rideId,
            NotificationType.OTP_GENERATED,
            rideReqeustEntity.getRideRequestId());

        // Fix for Error 1: Invalidate Passenger's Update List cache (so they see ARRIVED status instantly)
        String passengerEmail = rideReqeustEntity.getPassengerEntity().getEmail();
        this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passengerEmail);
    }
    // verify otp
    @Override
    @Transactional
    public void verifyOtp(Long rideId, Long rideRequestId, String otp) {
        PassengerRideRequestEntity rideRequestEntity = this.passengerRideRequestRepository
            .findByRideEntity_RideIdAndRideRequestId(rideId, rideRequestId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));

        // Safety Lock: Prevent duplicate arrival notifications if already onboard or completed
        if (rideRequestEntity.getRideRequestStatus() == RideRequestStatus.ONBOARDED || 
            rideRequestEntity.getRideRequestStatus() == RideRequestStatus.COMPLETED) {
            throw new InvalidRideStateException("Action blocked: Passenger is already onboard or ride is completed.");
        }

        if(!rideRequestEntity.getIsDriverReachedPickupLocation() && 
                rideRequestEntity.getRideRequestStatus() != RideRequestStatus.DRIVER_REACHED_PICKUP_LOCATION) {
            throw new RuntimeException("Driver has not reached pickup location.");
        }
        if (!rideRequestEntity.getOtp().equals(otp)) 
            throw new RuntimeException("Invalid OTP.");
        rideRequestEntity.setOtp(null);
        rideRequestEntity.setRideRequestStatus(RideRequestStatus.ONBOARDED);
        
        // Fix for Error 2 & Onboarding Stability: 
        // 1. Reset arrival flag so frontend stops fetching OTP
        rideRequestEntity.setIsDriverReachedPickupLocation(false);
        this.passengerRideRequestRepository.save(rideRequestEntity);

        // 2. Invalidate Passenger Cache so UI sees ONBOARDED immediately
        String passengerEmail = rideRequestEntity.getPassengerEntity().getEmail();
        this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passengerEmail);
    }
    // cancel pickup
    @Override
    @Transactional
    public void cancelPickup(String email, Long rideId, Long rideRequestId) {
        DriverProfileEntity driverProfile = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        UserEntity user = driverProfile.getUser();
        validateUserAccount(user);
        PassengerRideRequestEntity rideRequestEntity = this.passengerRideRequestRepository
            .findByRideEntity_RideIdAndRideRequestId(rideId, rideRequestId)
            .orElseThrow(() -> new NoEntryFoundException("Ride request not found."));
        
        if(!rideRequestEntity.getIsDriverReachedPickupLocation() && 
                rideRequestEntity.getRideRequestStatus() != RideRequestStatus.DRIVER_REACHED_PICKUP_LOCATION) {
            throw new InvalidRideStateException("Driver has not reached pickup location.");
        }
        
        rideRequestEntity.setRideRequestStatus(RideRequestStatus.NOT_BOARDED);
        rideRequestEntity.setIsDriverReachedPickupLocation(false);
        rideRequestEntity.setOtp(null);
        
        RideEntity rideEntity = rideRequestEntity.getRideEntity();
        // Correctly increment totalAvailableSeats
        rideEntity.setTotalAvailableSeats(rideEntity.getTotalAvailableSeats() + rideRequestEntity.getRequestedSeats());
        rideEntity.setTotalPassengersSharedRide(rideEntity.getTotalPassengersSharedRide() - 1);
        
        if(rideEntity.getRideStatus() == RideStatus.RIDE_FULL) 
            rideEntity.setRideStatus(RideStatus.RIDE_IN_PROGRESS);
            
        this.rideEntityRepository.save(rideEntity);
        this.passengerRideRequestRepository.save(rideRequestEntity);
    }
    // complete ride
    @Override
    @Transactional
    public RideCompletedDTO completeRide(String email, Long rideId) {
        DriverProfileEntity driverProfile = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        UserEntity user = driverProfile.getUser();
        validateUserAccount(user);
        RideEntity rideEntity = this.rideEntityRepository
            .findByRideIdAndDriverProfileEntity_DriverProfileId(rideId, driverProfile.getDriverProfileId())
            .orElseThrow(() -> new NoEntryFoundException("No ride found."));
        if (rideEntity.getRideStatus() == RideStatus.RIDE_COMPLETED)
            throw new InvalidRideStateException("This ride " + rideId + " is already marked as completed.");
        if (rideEntity.getRideStatus() != RideStatus.RIDE_IN_PROGRESS)
            throw new InvalidRideStateException("Only IN_PROGRESS rides can be marked as completed.");

        // Determine actual distance from GPS accumulator
        BigDecimal estimatedDistance = rideEntity.getEstimatedDistanceOfRide();
        BigDecimal actualDistance = estimatedDistance; // default fallback
        String rideGPSCacheKey = RIDE_GPS_UPDATES_CACHE_KEY + ":" + rideId;
        Object gpsObj = this.redisTemplate.opsForValue().get(rideGPSCacheKey);

        if (gpsObj instanceof RideGPSUpdatesDTO gpsDTO) {
            if (gpsDTO.getTotalDistanceTraveled() != null && gpsDTO.getTotalDistanceTraveled() > 0) {
                actualDistance = BigDecimal.valueOf(gpsDTO.getTotalDistanceTraveled())
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            }
        } else if (gpsObj instanceof java.util.Map) {
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) gpsObj;
            if (map.get("totalDistanceTraveled") != null) {
                double totalDist = ((Number) map.get("totalDistanceTraveled")).doubleValue();
                if (totalDist > 0) {
                    actualDistance = BigDecimal.valueOf(totalDist)
                        .setScale(2, java.math.RoundingMode.HALF_UP);
                }
            }
        }
        // else: GPS data expired or never recorded — fallback to estimatedDistance
        log.info("Ride {}: Estimated Distance = {} km, Actual GPS Distance = {} km", rideId, estimatedDistance, actualDistance);

        // Determine billing distance using 0.5 km threshold
        BigDecimal distanceDifference = actualDistance.subtract(estimatedDistance).abs();
        BigDecimal billingDistance;
        if (distanceDifference.compareTo(DISTANCE_THRESHOLD_KM) >= 0) {
            billingDistance = actualDistance;
            log.info("Ride {}: Distance difference {} km >= threshold. Using ACTUAL distance for billing.", rideId, distanceDifference);
        } else {
            billingDistance = estimatedDistance;
            log.info("Ride {}: Distance difference {} km < threshold. Using ESTIMATED distance for billing.", rideId, distanceDifference);
        }

        // Calculate total ride fare
        BigDecimal fareFromDistance = billingDistance.multiply(rideEntity.getPricePerKm());
        BigDecimal totalRideFare = rideEntity.getBaseFare().add(fareFromDistance)
            .setScale(2, java.math.RoundingMode.HALF_UP);

        // Fetch all ONBOARDED passengers (NOT_BOARDED are excluded — they are not charged)
        List<PassengerRideRequestEntity> onboardedPassengers = this.passengerRideRequestRepository
            .findByRideEntity_RideIdAndRideRequestStatus(rideId, RideRequestStatus.ONBOARDED);

        int totalOccupiedSeats = onboardedPassengers.stream()
            .mapToInt(PassengerRideRequestEntity::getRequestedSeats)
            .sum();
        int totalPassengersCompleted = onboardedPassengers.size();

        // Split fare across ALL offered seats (ride-sharing model: driver absorbs empty seat cost)
        int originalOfferedForSharing = totalOccupiedSeats + rideEntity.getTotalAvailableSeats();
        BigDecimal farePerSeat = BigDecimal.ZERO;
        if (originalOfferedForSharing > 0) {
            farePerSeat = totalRideFare.divide(
                BigDecimal.valueOf(originalOfferedForSharing), 2, java.math.RoundingMode.HALF_UP);
        }

        // Revenue = only what passengers actually pay (farePerSeat × occupied seats)
        BigDecimal collectedRevenue = farePerSeat.multiply(BigDecimal.valueOf(totalOccupiedSeats))
            .setScale(2, java.math.RoundingMode.HALF_UP);

        // Commission and earnings are based on collected revenue, not total ride cost
        BigDecimal systemCommission = collectedRevenue.multiply(systemCommissionRate)
            .setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal driverEarning = collectedRevenue.subtract(systemCommission)
            .setScale(2, java.math.RoundingMode.HALF_UP);

        for (PassengerRideRequestEntity passenger : onboardedPassengers) {
            BigDecimal passengerFare = farePerSeat.multiply(BigDecimal.valueOf(passenger.getRequestedSeats()))
                .setScale(2, java.math.RoundingMode.HALF_UP);
            passenger.setFinalFare(passengerFare);
            passenger.setFullJourneyFare(totalRideFare);
            passenger.setTotalSeatsOffered(originalOfferedForSharing);
            passenger.setRideRequestStatus(RideRequestStatus.COMPLETED);
            passenger.setRideCompletedAt(LocalDateTime.now());
            this.passengerRideRequestRepository.save(passenger);

            // Notify each passenger with their individual fare
            notificationService.createNotification(
                passenger.getPassengerEntity(),
                String.format("Your ride with %s is complete! Distance: %.1f km. Your fare: ₹%.2f. Thank you for riding with SATHI!",
                    user.getUserFullName(), billingDistance.doubleValue(), passengerFare.doubleValue()),
                NotificationType.RIDE_COMPLETED,
                passenger.getRideRequestId());

            // Invalidate Passenger's Update List and History cache
            String passengerEmail = passenger.getPassengerEntity().getEmail();
            this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passengerEmail);
            this.redisTemplate.delete(PASSENGER_RIDE_HISTORY_CACHE_KEY + ":" + passenger.getPassengerEntity().getUserId());
        }

        // Update the RideEntity with final financial data
        rideEntity.setRideStatus(RideStatus.RIDE_COMPLETED);
        rideEntity.setRideCompletiontime(LocalDateTime.now());
        rideEntity.setActualDistanceOfRide(actualDistance);
        rideEntity.setActualFare(collectedRevenue);
        rideEntity.setSystemCommission(systemCommission);
        rideEntity.setTotalDriverShare(driverEarning);
        this.rideEntityRepository.save(rideEntity);

        // Full cache invalidation
        this.redisTemplate.delete(DRIVER_RIDES_CACHE_PREFIX + email);
        this.redisTemplate.delete(DRIVER_HAS_RIDE_CACHE_PREFIX + email);
        this.redisTemplate.delete(ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId + ":unified");
        this.redisTemplate.delete(rideGPSCacheKey);
        this.redisTemplate.delete(RIDE_ENTITY_CACHE_KEY + ":" + rideId);
        this.redisTemplate.delete(DRIVER_ACCEPTED_RIDES_REQUESTS_CACHE_PREFIX + user.getUserId() + ":" + rideId + ":unified");
        java.util.Set<String> availableRideKeys = this.redisTemplate.keys("rides:available*");
        if (availableRideKeys != null && !availableRideKeys.isEmpty())
            this.redisTemplate.delete(availableRideKeys);
        
        // Invalidate Driver History Cache
        this.redisTemplate.delete(DRIVER_RIDE_HISTORY_CACHE_KEY + ":" + driverProfile.getDriverProfileId());

        log.info("Ride {} completed. Total Ride Cost: ₹{}, Collected Revenue: ₹{}, Fare/Seat: ₹{}, Driver Earning: ₹{}, Commission: ₹{}, Seats Offered: {}, Occupied Seats: {}, Passengers: {}",
            rideId, totalRideFare, collectedRevenue, farePerSeat, driverEarning, systemCommission, originalOfferedForSharing, totalOccupiedSeats, totalPassengersCompleted);

        // Return summary DTO
        return RideCompletedDTO.builder()
            .rideId(rideId)
            .rideStatus(RideStatus.RIDE_COMPLETED.name())
            .totalRideFare(collectedRevenue)
            .rideFarePerPassenger(farePerSeat)
            .systemCommission(systemCommission)
            .driverEarning(driverEarning)
            .estimatedDistance(estimatedDistance)
            .actualDistance(actualDistance)
            .billingDistance(billingDistance)
            .totalPassengersCompleted(totalPassengersCompleted)
            .totalSeatsOccupied(totalOccupiedSeats)
            .fullJourneyCost(totalRideFare)
            .totalSeatsOffered(originalOfferedForSharing)
            .message(String.format("Ride completed. Fare split across %d offered seats (₹%.2f/seat). %d seat(s) booked. Billing based on %s distance.",
                originalOfferedForSharing, farePerSeat, totalOccupiedSeats,
                distanceDifference.compareTo(DISTANCE_THRESHOLD_KM) >= 0 ? "actual GPS" : "estimated"))
            .build();
    }
    // rate passenger
    @Transactional
    @Override
    public String ratePassenger(String email, UserRateRequestDTO userRateRequestDTO){
        if (userRateRequestDTO.getRating() < 1 || userRateRequestDTO.getRating() > 5) 
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository
            .findByUserEmail(email)
            .orElseThrow(() -> new NoEntryFoundException("Driver not found"));
        validateUserAccount(driverProfileEntity.getUser());
        Optional<UserRatingEntity> existingRating = this.userRatingRepository
            .findByRideEntity_RideIdAndRideRequestEntity_RideRequestId(
                userRateRequestDTO.getRideId(), userRateRequestDTO.getRideRequestId());
        if(existingRating.isPresent())
            throw new IllegalArgumentException("Passenger already rated");
        RideEntity rideEntity = this.rideEntityRepository.findByRideIdAndDriverProfileEntity_DriverProfileId(
            userRateRequestDTO.getRideId(), driverProfileEntity.getDriverProfileId())
            .orElseThrow(() -> new NoEntryFoundException("Ride not found"));
        if(rideEntity.getRideStatus() != RideStatus.RIDE_COMPLETED)
            throw new IllegalArgumentException("Ride is not completed. Cannot rate passenger.");
        PassengerRideRequestEntity passengerRideRequestEntity = this.passengerRideRequestRepository.findByRideEntity_RideIdAndRideRequestId(
            rideEntity.getRideId(), userRateRequestDTO.getRideRequestId())
            .orElseThrow(() -> new NoEntryFoundException("Passenger ride request not found"));
        if(passengerRideRequestEntity.getRideRequestStatus() != RideRequestStatus.COMPLETED)
            throw new IllegalArgumentException("Passenger ride request is not completed. Cannot rate passenger.");
        UserRatingEntity ratingEntity = UserRatingEntity.builder()
            .ratedBy(driverProfileEntity.getUser())
            .ratedUser(passengerRideRequestEntity.getPassengerEntity())
            .rating(userRateRequestDTO.getRating())
            .review(userRateRequestDTO.getComment())
            .rideEntity(rideEntity)
            .rideRequestEntity(passengerRideRequestEntity)
            .ratedAt(LocalDateTime.now())
            .build();
        UserEntity passenger = this.userEntityRepository.findWithPessimisticLockById(passengerRideRequestEntity.getPassengerEntity().getUserId())
            .orElseThrow(() -> new UserNotFoundException("Passenger user not found."));
            
        passenger.setAverageRating(
            (passenger.getAverageRating() * passenger.getTotalRatingsCount() + userRateRequestDTO.getRating())
            / (passenger.getTotalRatingsCount() + 1));
        passenger.setTotalRatingsCount(passenger.getTotalRatingsCount() + 1);
        
        this.userRatingRepository.save(ratingEntity);
        this.userEntityRepository.save(passenger);
        this.redisTemplate.delete(RIDE_REQUEST_UPDATES_CACHE_KEY + ":" + passenger.getEmail());
        return "Passenger rated successfully";
    }
//    get driver ride history dto
    private static final String DRIVER_RIDE_HISTORY_CACHE_KEY = "driver_ride_history";
    private static final long CACHE_TTL_SECONDS = 300; // 5 minutes
    @SuppressWarnings("unchecked")
    @Override
    public List<DriverRideHistoryDTO> driverRideHistoryDTO(String email) {
        DriverProfileEntity driverProfile = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver profile not found."));
        UserEntity user = driverProfile.getUser();
        validateUserAccount(user);
        Long driverId = driverProfile.getDriverProfileId();
        String rideHistoryCacheKey = DRIVER_RIDE_HISTORY_CACHE_KEY + ":" + driverId;
        List<DriverRideHistoryDTO> rideHistory = (List<DriverRideHistoryDTO>) this.redisTemplate
            .opsForValue().get(rideHistoryCacheKey);
        if(rideHistory != null)
            return rideHistory;
        List<RideEntity> rideEntities = this.rideEntityRepository.findByDriverProfileId(driverProfile.getDriverProfileId());
        if(rideEntities == null || rideEntities.isEmpty())
            throw new NoEntryFoundException("No ride found for the driver.");

        // N+1 Bulk fetch all passengers for these rides
        List<Long> rideIds = rideEntities.stream().map(RideEntity::getRideId).toList();
        List<RideJoinedPassengersDTO> allPassengers = this.passengerRideRequestRepository
                .findRideJoinedPassengersBulk(rideIds, driverProfile.getDriverProfileId());
        // Group passengers by rideId
        java.util.Map<Long, List<RideJoinedPassengersDTO>> passengersByRideId = allPassengers.stream()
                .collect(Collectors.groupingBy(RideJoinedPassengersDTO::getRideId));
        rideHistory = rideEntities.stream()
                .map(ride -> mapToDriverRideHistoryDTO(ride, passengersByRideId.getOrDefault(ride.getRideId(), java.util.Collections.emptyList())))
                .toList();
        this.redisTemplate.opsForValue().set(rideHistoryCacheKey, rideHistory, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        return rideHistory;
    }

    // helper methods
//    map to DriverRideHistoryDTO
    private DriverRideHistoryDTO mapToDriverRideHistoryDTO(RideEntity ride, List<RideJoinedPassengersDTO> joinedPassengers) {
        return DriverRideHistoryDTO.builder()
                .rideId(ride.getRideId())
                .rideDate(ride.getRideDepartureTime().toLocalDate())
                .rideStartedAt(ride.getRideStartedAt())
                .rideEndedAt(ride.getRideCompletiontime())
                .totalPassengersCount(ride.getTotalPassengersSharedRide())
                .distanceCovered(ride.getActualDistanceOfRide() != null 
                    ? ride.getActualDistanceOfRide().doubleValue() : 0.0)
                .rideEarning(ride.getTotalDriverShare() != null 
                    ? ride.getTotalDriverShare() : BigDecimal.ZERO)
                .rideStartingAddress(ride.getSourceAddress())
                .rideEndedAddress(ride.getDestinationAddress())
                .joinedPassengers(joinedPassengers)
                .build();
    }
    // map to ride RideCacheDTO
    private RideCacheDTO mapToRideCacheDTO(RideEntity rideEntity) {
        return RideCacheDTO.builder()
            .rideId(rideEntity.getRideId())
            .driverProfileId(rideEntity.getDriverProfileEntity().getDriverProfileId())
            .sourceAddress(rideEntity.getSourceAddress())
            .destinationAddress(rideEntity.getDestinationAddress())
            .rideStatus(rideEntity.getRideStatus())
            .totalAvailableSeats(rideEntity.getTotalAvailableSeats())
            .rideDepartureTime(rideEntity.getRideDepartureTime())
            .rideStartedAt(rideEntity.getRideStartedAt())
            .build();
    }
    
    // calculate price per km of ride
    private BigDecimal calculateBaseFareOfRide(VehicleClass vehicleClass, VehicleCategory vehicleCategory) {
        BigDecimal basePrice = switch (vehicleCategory) {
            case HATCHBACK -> BigDecimal.valueOf(6);
            case SEDAN -> BigDecimal.valueOf(8);
            case SUV -> BigDecimal.valueOf(10);
            case MUV -> BigDecimal.valueOf(9);
            case AUTO_RICKSHAW -> BigDecimal.valueOf(5);
            case BIKE -> BigDecimal.valueOf(4);
            default -> throw new IllegalArgumentException("Unsupported vehicle category.");
        };
        return switch (vehicleClass) {
            case ECONOMY -> basePrice;
            case STANDARD -> basePrice.add(BigDecimal.valueOf(2));
            case PREMIUM -> basePrice.add(BigDecimal.valueOf(4));
        };
    }
    
    // calculate distance by Haversine formula
    private double calculateDistanceByHaverSineFormula(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    // parse enum
    private <T extends Enum<T>> T parseEnum(Class<T> enumClass, String value) {
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            String allowed = Arrays.stream(enumClass.getEnumConstants())
            .map(Enum::name)
            .collect(Collectors.joining(", "));
            throw new IllegalArgumentException(
                "Invalid " + enumClass.getSimpleName() + ". Allowed: " + allowed);
            }
        }
        
    // validate User's account
    private void validateUserAccount(UserEntity user) {
        if (!user.getIsEmailVerified()) {
            throw new AccessDeniedException("User account is not verified.");
        }
        if (user.getIsAdminSuspendedAccount()) {
            throw new AccessDeniedException("User account is suspended.");
        }
        if (user.getAccountStatus() == UserAccountStatus.INACTIVE) {
            throw new AccessDeniedException("User account is inactive.");
        }
        if (!user.getUserRoles().contains(UserRole.DRIVER)) {
            throw new AccessDeniedException("User is not a driver.");
        }
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        return String.format("%04d", random.nextInt(10000));
    }

}