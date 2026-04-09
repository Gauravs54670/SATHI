package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.UpdateDriverProfileRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RidePostResponseDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO.RideRequestDTO;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverVerificationStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
import com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity.RideStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.DriverEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service 
public class DriverServiceImplementation implements DriverService{
    // Constants
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static BigDecimal BASE_PRICE = BigDecimal.valueOf(10.0);
    // Redis key prefix for user profiles
    private static final String DRIVER_PROFILE_CACHE_PREFIX = "driver:profile:";
    // Cache TTL (time-to-live) in minutes
    private static final long CACHE_TTL_MINUTES = 30;
    private final RedisTemplate<String, Object> redisTemplate;  
    private final UserEntityRepository userEntityRepository;
    private final DriverEntityRepository driverEntityRepository;
    public DriverServiceImplementation(
        UserEntityRepository userEntityRepository,
        RedisTemplate<String, Object> redisTemplate,
        DriverEntityRepository driverEntityRepository) {
        this.redisTemplate = redisTemplate;
        this.driverEntityRepository = driverEntityRepository;
        this.userEntityRepository = userEntityRepository;
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
        if(profile.getAverageRating() == null)
            profile.setAverageRating(0.0);
        if(profile.getTotalRatingsCount() == null)
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
        if(request.getLicenseExpirationDate() != null) {
            if(request.getLicenseExpirationDate().isBefore(LocalDate.now()))
                throw new IllegalArgumentException("Licence already expired.");
            driverProfileEntity.setLicenseExpirationDate(request.getLicenseExpirationDate());
        }
        if(request.getVehicleModel() != null && !request.getVehicleModel().isEmpty())
            driverProfileEntity.setVehicleModel(request.getVehicleModel());
        if(request.getVehicleNumber() != null && !request.getVehicleNumber().isEmpty()) {
            Optional<DriverProfileEntity> profile = this.driverEntityRepository.findByVehicleNumber(request.getVehicleNumber());
            if(profile.isPresent() && !profile.get().getDriverProfileId().equals(driverProfileEntity.getDriverProfileId()))
                throw new IllegalArgumentException("Vehicle number already registered.");
            driverProfileEntity.setVehicleNumber(request.getVehicleNumber());
        }
        if(request.getVehicleSeatCapacity() != null && request.getVehicleSeatCapacity() > 0)
            driverProfileEntity.setVehicleSeatCapacity(request.getVehicleSeatCapacity());
        if(request.getVehicleCategory() != null && !request.getVehicleCategory().isEmpty()) {
            driverProfileEntity.setVehicleCategory(parseEnum(VehicleCategory.class, request.getVehicleCategory()));
        }
        if(request.getVehicleClass() != null && !request.getVehicleClass().isEmpty()) {
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
        if(driverAvailabilityStatus != null && !driverAvailabilityStatus.isEmpty()) {
            driverProfileEntity.setDriverAvailabilityStatus(parseEnum(DriverAvailabilityStatus.class, driverAvailabilityStatus));
        }
        driverProfileEntity.setUpdatedAt(LocalDateTime.now());
        this.driverEntityRepository.save(driverProfileEntity);
        this.redisTemplate.delete(DRIVER_PROFILE_CACHE_PREFIX + email);
        return "Driver availability status changed to " + driverProfileEntity.getDriverAvailabilityStatus().toString();
    }
    // post ride
    @Override
    @Transactional
    public RidePostResponseDTO postRide(String email, RideRequestDTO rideRequestDTO){
        DriverProfileEntity driverProfileEntity = this.driverEntityRepository.findByUserEmail(email)
            .orElseThrow(() -> new UserNotFoundException("Driver Profile not found."));
        UserEntity user = driverProfileEntity.getUser();
        this.validateUserAccount(user);
        if(driverProfileEntity.getDriverAvailabilityStatus() == DriverAvailabilityStatus.NOT_AVAILABLE || 
                driverProfileEntity.getDriverAvailabilityStatus() == DriverAvailabilityStatus.OFF_DUTY)
            throw new IllegalArgumentException("Driver is not available to post a ride. "
                + "Please change your availability status to AVAILABLE.");
        // 1. Basic Validations (already partially handled by @Valid, but keep service-level logic)
        if(rideRequestDTO.getAvailableSeats() > driverProfileEntity.getVehicleSeatCapacity())
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
                rideRequestDTO.getDestinationLat(), rideRequestDTO.getDestinationLong()
            );
            log.info("Using straight-line fallback distance: {} km", distance);
        }

        BigDecimal distanceBD = BigDecimal.valueOf(distance);
        BigDecimal estimatedFare = distanceBD.multiply(rideRequestDTO.getPricePerKm());

        // 3. Log the Full Request for Backend Verification
        log.info("RIDE POST REQUEST [TEST MODE] - User: {}, Source: {}, Destination: {}, Distance: {} km, Fare: ₹{}, RoutePath: {}", 
            email, rideRequestDTO.getBoardingAddress(), rideRequestDTO.getDestinationAddress(), 
            String.format("%.2f", distance), estimatedFare.setScale(2, java.math.RoundingMode.HALF_UP),
            rideRequestDTO.getRoutePath() != null ? "RECEIVED" : "MISSING");

        // 4. Return Mapped Response
        RidePostResponseDTO response = new RidePostResponseDTO();
        response.setRideId(0L); // Mock ID
        response.setDriverName(user.getUserFullName());
        response.setSourceLat(rideRequestDTO.getSourceLat());
        response.setSourceLong(rideRequestDTO.getSourceLong());
        response.setBoardingAddress(rideRequestDTO.getBoardingAddress());
        response.setDestinationLat(rideRequestDTO.getDestinationLat());
        response.setDestinationLong(rideRequestDTO.getDestinationLong());
        response.setDestinationAddress(rideRequestDTO.getDestinationAddress());
        response.setDepartureTime(rideRequestDTO.getDepartureTime());
        response.setAvailableSeats(rideRequestDTO.getAvailableSeats());
        response.setPricePerKm(rideRequestDTO.getPricePerKm());
        response.setEstimatedTotalDistance(distanceBD.setScale(2, java.math.RoundingMode.HALF_UP));
        response.setEstimatedRideFare(estimatedFare.setScale(2, java.math.RoundingMode.HALF_UP));
        response.setRoutePath(rideRequestDTO.getRoutePath());

        return response;
    }
    // helper methods
    // calculate price per km of ride
    private BigDecimal calculatePricePerKmOfRide(VehicleClass vehicleClass, VehicleCategory vehicleCategory) {
        switch (vehicleCategory) {
            case HATCHBACK -> BASE_PRICE = BigDecimal.valueOf(6);
            case SEDAN -> BASE_PRICE = BigDecimal.valueOf(8);
            case SUV -> BASE_PRICE = BigDecimal.valueOf(10);
            case MUV -> BASE_PRICE = BigDecimal.valueOf(9);
            case AUTO_RICKSHAW -> BASE_PRICE = BigDecimal.valueOf(5);
            case BIKE -> BASE_PRICE = BigDecimal.valueOf(4);
            default -> throw new IllegalArgumentException("Unsupported vehicle category.");
        }
        return switch (vehicleClass) {
            case ECONOMY -> BASE_PRICE;
            case STANDARD -> BASE_PRICE.add(BigDecimal.valueOf(2));
            case PREMIUM -> BASE_PRICE.add(BigDecimal.valueOf(4));
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
    private void validateUserAccount(UserEntity user){
        if(user.getIsAdminSuspendedAccount()){
            throw new AccessDeniedException("User account is suspended.");
        }
        if(user.getAccountStatus() == UserAccountStatus.INACTIVE){
            throw new AccessDeniedException("User account is inactive.");
        }
        if(!user.getIsEmailVerified()){
            throw new AccessDeniedException("User email is not verified.");
        }
        if(!user.getUserRoles().contains(UserRole.DRIVER)){
            throw new AccessDeniedException("User is not a driver.");
        }
    }
}
