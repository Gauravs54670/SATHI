package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

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
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
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
    // helper methods
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
