package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.PassengerRideBookingRequestsDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.DriverPostedRides;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RidePostResponseDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoActiveRideFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoEntryFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.DriverEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.PassengerRideRequestRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.RideEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DriverServiceImplementation implements DriverService {
    // Constants
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final BigDecimal systemCommissionRate = BigDecimal.valueOf(0.1);
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
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserEntityRepository userEntityRepository;
    private final DriverEntityRepository driverEntityRepository;
    private final RideEntityRepository rideEntityRepository;
    private final PassengerRideRequestRepository passengerRideRequestRepository;

    public DriverServiceImplementation(
            PassengerRideRequestRepository passengerRideRequestRepository,
            UserEntityRepository userEntityRepository,
            RedisTemplate<String, Object> redisTemplate,
            DriverEntityRepository driverEntityRepository,
            RideEntityRepository rideEntityRepository) {
        this.redisTemplate = redisTemplate;
        this.driverEntityRepository = driverEntityRepository;
        this.userEntityRepository = userEntityRepository;
        this.rideEntityRepository = rideEntityRepository;
        this.passengerRideRequestRepository = passengerRideRequestRepository;
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
        // 1. Basic Validations (already partially handled by @Valid, but keep
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
                Arrays.asList(RideStatus.RIDE_POSTED, RideStatus.RIDE_STARTED),
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
                Arrays.asList(RideStatus.RIDE_POSTED, RideStatus.RIDE_STARTED),
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

    // get driver's posted rides requests (sorted by nearest passenger first)
    @Override
    @Transactional
    public List<PassengerRideBookingRequestsDTO> getMyPostedRidesRequests(String email, Long rideId) {
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        validateUserAccount(driverProfileEntity.getUser());
        String cacheKey = ACTIVE_RIDES_REQUESTS_CACHE_PREFIX + rideId;
        @SuppressWarnings("unchecked")
        List<PassengerRideBookingRequestsDTO> cachedRequests = (List<PassengerRideBookingRequestsDTO>) this.redisTemplate
                .opsForValue().get(cacheKey);
        if (cachedRequests != null)
            return cachedRequests;
        // Fetch the ride entity to get the driver's source coordinates
        RideEntity rideEntity = this.rideEntityRepository.findById(rideId)
                .orElseThrow(() -> new NoEntryFoundException("Ride not found."));
        if (!Objects.equals(rideEntity.getDriverProfileEntity().getUser().getUserId(),
                driverProfileEntity.getUser().getUserId()))
            throw new NoEntryFoundException("You are not authorized to access this ride.");
        LocalDateTime dayStartedAt = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime dayEndedAt = LocalDateTime.now().toLocalDate().atTime(23, 59, 59);
        // Fetch all pending requests for this ride
        List<PassengerRideBookingRequestsDTO> rideRequests = this.passengerRideRequestRepository
                .findPassengerRideBookingRequestsByDriverId(
                        driverProfileEntity.getUser().getUserId(), rideId, dayStartedAt, dayEndedAt);
        if (rideRequests == null || rideRequests.isEmpty())
            throw new NoEntryFoundException("No ride requests found.");
        this.redisTemplate.opsForValue().set(cacheKey, rideRequests, ACTIVE_RIDES_REQUESTS_CACHE_TTL_MINUTES,
                TimeUnit.MINUTES);
        return rideRequests;
    }

    // helper methods
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

    // private String extractCity(String address) {
    // if (address == null || address.isEmpty()) return null;
    // String[] parts = address.split(",");
    // if (parts.length >= 3) {
    // // Usually City is the 3rd or 4th part from the end or start depending on
    // format
    // // e.g. "Civil Lines, Prayagraj, Uttar Pradesh, India" -> Prayagraj
    // return parts[parts.length - 3].trim();
    // }
    // return null;
    // }
}
