package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.Exception.DuplicateEntryException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
public class UserServiceImplementation implements UserService {

    private final Cloudinary cloudinary;
    private final UserEntityRepository userEntityRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    // Redis key prefix for user profiles
    private static final String USER_PROFILE_CACHE_PREFIX = "user:profile:";
    // Cache TTL (time-to-live) in minutes
    private static final long CACHE_TTL_MINUTES = 30;
    public UserServiceImplementation(
        Cloudinary cloudinary,
        PasswordEncoder passwordEncoder,
        UserEntityRepository userEntityRepository,
        RedisTemplate<String, Object> redisTemplate) {
            this.cloudinary = cloudinary;
            this.passwordEncoder = passwordEncoder;
            this.userEntityRepository = userEntityRepository;
            this.redisTemplate = redisTemplate;
    }

    // register user
    @Override
    public UserRegistrationResponse registerUser(UserRegistrationRequest request) {
        UserEntity user = this.userEntityRepository
        .findByEmailAndPhoneNumber(request.getEmail(), request.getPhoneNumber())
        .orElse(null);
        if(user != null)
            throw new DuplicateEntryException("User already exists");
        user = UserEntity.builder()
        .userFullName(request.getUserFullName())
        .email(request.getEmail())
        .phoneNumber(request.getPhoneNumber())
        .password(this.passwordEncoder.encode(request.getPassword()))
        .gender(request.getGender())
        .accountStatus(UserAccountStatus.ACTIVE)
        .userRoles(Set.of(UserRole.USER, UserRole.PASSENGER))
        .build();
        user = this.userEntityRepository.save(user);
        return UserRegistrationResponse.builder()
        .userId(user.getUserId())
        .userFullName(user.getUserFullName())
        .email(user.getEmail())
        .phoneNumber(user.getPhoneNumber())
        .gender(user.getGender())
        .accountStatus(user.getAccountStatus())
        .userRoles(user.getUserRoles())
        .accountCreatedAt(user.getAccountCreatedAt())
        .message("User registered successfully")
        .build();
    }

    // get user profile — checks Redis cache first, falls back to DB
    @Override
    public UserProfileDTO getUserProfileByEmail(String email) {
        String cacheKey = USER_PROFILE_CACHE_PREFIX + email;
        // Try to get from Redis cache
        UserProfileDTO cachedProfile = (UserProfileDTO) redisTemplate.opsForValue().get(cacheKey);
        if (cachedProfile != null) 
            return cachedProfile;
        // Cache miss — fetch from database
        UserProfileDTO profileDTO = this.userEntityRepository.findUserProfileByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Store in Redis with TTL (auto-expires after 30 minutes)
        redisTemplate.opsForValue().set(cacheKey, profileDTO, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        return profileDTO;
    }
    // Upload or replace the user's profile photo on Cloudinary
    // Uses a fixed public_id per user so re-uploads always REPLACE the old image
    @Override @Transactional
    public String uploadProfile(String email, MultipartFile file) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        validateUserAccountStatus(user);
        // Build a deterministic public_id so the same user always overwrites the same image
        String publicId = "user/" + user.getUserId() + "/profile";
        try {
            log.info("Uploading profile photo for user: {}", email);
            Map<String, Object> uploadOptions = new HashMap<>();
            uploadOptions.put("resource_type", "image");
            uploadOptions.put("folder", "profile_photos");
            uploadOptions.put("public_id", publicId);
            // overwrite = true → replaces the old image at this public_id
            uploadOptions.put("overwrite", true);
            // invalidate = true → clears CDN cache so the new photo loads immediately
            uploadOptions.put("invalidate", true);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = this.cloudinary.uploader().upload(file.getBytes(), uploadOptions);
            String profileUrl = (String) result.get("secure_url");
            user.setProfilePictureUrl(profileUrl);
            user.setAccountUpdatedAt(LocalDateTime.now());
            this.userEntityRepository.save(user);
            // Evict cached profile from Redis so next fetch gets the updated photo URL
            String cacheKey = USER_PROFILE_CACHE_PREFIX + email;
            redisTemplate.delete(cacheKey);
            log.info("Profile photo uploaded successfully for user: {}", user.getUserFullName());
            return profileUrl;

        } catch (Exception e) {
            log.error("Profile photo upload failed for user: {}", email, e);
            // Cleanup: if upload succeeded but DB save failed, remove the orphan from Cloudinary
            try {
                cloudinary.uploader().destroy("profile_photos/" + publicId, Map.of());
                log.info("Rolled back uploaded image from Cloudinary");
            } catch (Exception ex) {
                log.error("Failed to rollback Cloudinary upload", ex);
            }
            throw new RuntimeException("Photo upload failed. Please try again.");
        }
    }
    // helper methods
    private void validateUserAccountStatus(UserEntity user) {
        if (user.getAccountStatus() == UserAccountStatus.INACTIVE)
            throw new AccessDeniedException("User account is inactive. Please verify your account first.");
        if (user.getAccountStatus() == UserAccountStatus.SUSPENDED)
            throw new AccessDeniedException("User account is suspended by ADMIN.");
        if (user.getAccountStatus() == UserAccountStatus.DELETED)
            throw new AccessDeniedException("User account is deleted.");
    }

}
