package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.ChangePasswordRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.EmergencyContactDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileUpdateRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.Exception.DuplicateEntryException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.EmergencyContactEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.EmergencyContactRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
public class UserServiceImplementation implements UserService, AuthService {

    private final JavaMailSender javaMailSender;
    private final EmergencyContactRepository emergencyContactRepository;
    private final Cloudinary cloudinary;
    private final UserEntityRepository userEntityRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    // Redis key prefix for user profiles
    private static final String USER_PROFILE_CACHE_PREFIX = "user:profile:";
    // Cache TTL (time-to-live) in minutes
    private static final long CACHE_TTL_MINUTES = 30;
    
    // Redis keys and settings for OTP rate limiting
    private static final String USER_OTP_CACHE_PREFIX = "user:otp:val:";
    private static final String USER_OTP_REQ_COUNT_PREFIX = "user:otp:req:";
    private static final long OTP_TTL_MINUTES = 5;
    private static final long OTP_RATE_LIMIT_MINUTES = 15;
    private static final int MAX_OTP_REQUESTS = 3;
    public UserServiceImplementation(
        JavaMailSender javaMailSender,
        EmergencyContactRepository emergencyContactRepository,
        Cloudinary cloudinary,
        PasswordEncoder passwordEncoder,
        UserEntityRepository userEntityRepository,
        RedisTemplate<String, Object> redisTemplate) {
            this.javaMailSender = javaMailSender;
            this.emergencyContactRepository = emergencyContactRepository;
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
        List<EmergencyContactDTO> emergencyContacts = this.emergencyContactRepository
                    .findEmergencyContactsByEmail(email);
                    if(emergencyContacts == null || emergencyContacts.isEmpty())
                        emergencyContacts = new ArrayList<>();
        profileDTO.setEmergencyContacts(emergencyContacts);
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
    // update user profile
    @Override 
    @Transactional
    @CachePut(value = USER_PROFILE_CACHE_PREFIX, key = "#email")
    public UserProfileDTO updateProfile(String email, UserProfileUpdateRequest request) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        if(request.getUserFullName() != null && !request.getUserFullName().isEmpty())
            user.setUserFullName(request.getUserFullName());
        if(request.getGender() != null && !request.getGender().isEmpty())
            user.setGender(request.getGender());
        if(request.getBio() != null && !request.getBio().isEmpty())
            user.setBio(request.getBio());
        if(request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()){
            if(request.getPhoneNumber().length() > 10) 
                throw new IllegalArgumentException("Invalid phone number." + " Please check the phone number.");
            if(this.userEntityRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent())
                throw new DuplicateEntryException("Phone number already exists.");
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if(request.getEmergencyContacts() != null && !request.getEmergencyContacts().isEmpty()){
            if (request.getEmergencyContacts().size() >= 3)
                throw new IllegalArgumentException("Maximum 3 emergency contacts allowed.");
            final UserEntity finalUser = user;
            List<EmergencyContactEntity> existingContacts = user.getEmergencyContacts();
            Set<String> existingPhoneNumbers = existingContacts.stream()
                    .map(EmergencyContactEntity::getPhoneNumber)
                    .collect(Collectors.toSet());
            List<EmergencyContactEntity> emergencyContacts = request.getEmergencyContacts()
                    .stream()
                    .filter(contact -> contact.getContact() != null && !contact.getContact().isEmpty())
                    .filter(contact -> !existingPhoneNumbers.contains(contact.getContact()))
                    .map(contact -> {
                        EmergencyContactEntity emergencyContact = new EmergencyContactEntity();
                        emergencyContact.setUser(finalUser);
                        emergencyContact.setName(contact.getName());
                        emergencyContact.setPhoneNumber(contact.getContact());
                        return emergencyContact;
                    })
                    .collect(Collectors.toList());
            existingContacts.addAll(emergencyContacts);
            user.setEmergencyContacts(existingContacts);
        }
        user.setAccountUpdatedAt(LocalDateTime.now());
        user = this.userEntityRepository.save(user);
        return this.getUserProfileByEmail(email);
    }
    // delete emergency contact number
    @Override
    @Transactional
    @CacheEvict(value = USER_PROFILE_CACHE_PREFIX, key = "#email")
    public void deleteEmergencyContact(String email, Long contactId) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        List<EmergencyContactEntity> emergencyContacts = user.getEmergencyContacts();
        // Find the contact — must belong to THIS user
        EmergencyContactEntity toRemove = emergencyContacts.stream()
            .filter(c -> c.getId().equals(contactId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                "Emergency contact not found or doesn't belong to this user."));
        // Remove from user's list → orphanRemoval handles the DB DELETE automatically
        emergencyContacts.remove(toRemove);
        this.userEntityRepository.save(user);
    }
    // change account password
    @Override
    @Transactional
    @CacheEvict(value = USER_PROFILE_CACHE_PREFIX, key = "#email")
    public void changeAccountPassword(String email, ChangePasswordRequest request) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
            if(!passwordEncoder.matches(request.getOldPassword(), user.getPassword()))
                throw new AccessDeniedException("Old password not matched.");
            if(passwordEncoder.matches(request.getNewPassword(), user.getPassword()))
                throw new IllegalArgumentException("New password cannot be same as old password.");
            if(request.getNewPassword().length() < 8)
                throw new IllegalArgumentException("New password must be at least 8 characters long.");
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setAccountUpdatedAt(LocalDateTime.now());
            this.userEntityRepository.save(user);
            log.info("Password changed successfully for user: {}", user.getUserFullName());
    }
    // request OTP
    @Override
    public String requestOtp(String email) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        String countKey = USER_OTP_REQ_COUNT_PREFIX + email;
        Integer reqCount = (Integer) redisTemplate.opsForValue().get(countKey);
        if (reqCount != null && reqCount >= MAX_OTP_REQUESTS) {
            Long ttl = redisTemplate.getExpire(countKey, TimeUnit.MINUTES);
            long waitMinutes = (ttl != null && ttl > 0) ? ttl : OTP_RATE_LIMIT_MINUTES;
            throw new RuntimeException("Maximum OTP request limit reached. Please try again after " + waitMinutes + " minutes.");
        }
        if (reqCount == null) 
            redisTemplate.opsForValue().set(countKey, 1, OTP_RATE_LIMIT_MINUTES, TimeUnit.MINUTES);
        else {
            Long ttl = redisTemplate.getExpire(countKey, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(countKey, reqCount + 1, ttl != null && ttl > 0 ? ttl : (OTP_RATE_LIMIT_MINUTES * 60), TimeUnit.SECONDS);
        }
        String otp = generateOtp();
        String otpKey = USER_OTP_CACHE_PREFIX + email;
        redisTemplate.opsForValue().set(otpKey, otp, OTP_TTL_MINUTES, TimeUnit.MINUTES);
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(email);
        mailMessage.setSubject("OTP for Password Reset");
        mailMessage.setText("Your 6-digit verification code is: " + otp +
                        "\nThis code is valid for " + OTP_TTL_MINUTES + " minutes.");
        javaMailSender.send(mailMessage);
        log.info("Generated OTP for {}", email);
        return "OTP sent successfully. It is valid for " + OTP_TTL_MINUTES + " minutes.";
    }
    // reset password
    @Override
    @Transactional
    @CacheEvict(value = USER_PROFILE_CACHE_PREFIX, key = "#email")
    public String resetPassword(String email, String otp, String newPassword) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        String otpKey = USER_OTP_CACHE_PREFIX + email;
        String storedOtp = (String) redisTemplate.opsForValue().get(otpKey);
        if (storedOtp == null)
            throw new AccessDeniedException("OTP expired or invalid. Request new OTP.");
        if (!storedOtp.equals(otp))
            throw new AccessDeniedException("Invalid OTP.");
        redisTemplate.delete(otpKey);
        if(newPassword == null || newPassword.length() < 8)
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setAccountUpdatedAt(LocalDateTime.now());
        this.userEntityRepository.save(user);
        redisTemplate.delete(USER_OTP_REQ_COUNT_PREFIX + email);
        log.info("Password reset successfully for user: {}", user.getUserFullName());
        return "Password reset successfully.";
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
    private String generateOtp() {
        return String.valueOf((int) (Math.random() * 900000 + 100000));
    }
}
