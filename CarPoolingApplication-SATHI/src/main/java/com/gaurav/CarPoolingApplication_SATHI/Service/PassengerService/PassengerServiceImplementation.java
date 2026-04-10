package com.gaurav.CarPoolingApplication_SATHI.Service.PassengerService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.gaurav.CarPoolingApplication_SATHI.DTO.PassengerRideRequestDTO.AvailablePostedRideDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Repository.RideEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

@Service
public class PassengerServiceImplementation implements PassengerService {

    // Redis key prefix for user profiles
    private static final String AVAILABLE_RIDES_GLOBAL_CACHE_KEY = "rides:available";
    // Cache TTL (time-to-live) in minutes
    private static final long CACHE_TTL_MINUTES = 10;
    private final RedisTemplate<String,Object> redisTemplate;
    private final UserEntityRepository userEntityRepository;
    private final RideEntityRepository rideEntityRepository;
    public PassengerServiceImplementation(
        RedisTemplate<String,Object> redisTemplate,
        UserEntityRepository userEntityRepository, RideEntityRepository rideEntityRepository) {
        this.redisTemplate = redisTemplate;
        this.userEntityRepository = userEntityRepository;
        this.rideEntityRepository = rideEntityRepository;
    }
    @Override
    public List<AvailablePostedRideDTO> getAvailableRides(String email, String city) {
        UserEntity userEntity = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        validatePassengerAccount(userEntity);
        // Define Cache Key based on city
        String cacheKey = (city == null || city.trim().isEmpty()) 
                        ? AVAILABLE_RIDES_GLOBAL_CACHE_KEY 
                        : AVAILABLE_RIDES_GLOBAL_CACHE_KEY + ":" + city.trim().toLowerCase();

        // Fetch from Global/City Cache
        @SuppressWarnings("unchecked")
        List<AvailablePostedRideDTO> availableRides = (List<AvailablePostedRideDTO>) redisTemplate.opsForValue().get(cacheKey);
        if (availableRides == null) {
            // Cache Miss: Fetch from DB (filtered by city if provided)
            availableRides = this.rideEntityRepository.findAvailableRides(LocalDateTime.now(), city);
            // Save to Cache
            this.redisTemplate.opsForValue().set(cacheKey, availableRides, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        }
        // Filter out the passenger's own posted rides in-memory
        // We use a new list to avoid modifying the cached reference if it came from Redis (though serialization usually prevents this, it's safer)
        final String passengerEmail = userEntity.getEmail();
        availableRides.removeIf(ride -> ride.getDriverEmail().equals(passengerEmail));
        return availableRides;
    }
    // helper methods
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
