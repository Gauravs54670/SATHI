package com.gaurav.CarPoolingApplication_SATHI.Service.DriverService;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
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
    // helper methods
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
