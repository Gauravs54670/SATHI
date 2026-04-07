package com.gaurav.CarPoolingApplication_SATHI.Service.UserService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
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
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.DriverDTO.DriverRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.ChangePasswordRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.EmergencyContactDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileUpdateRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationRequest;
import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserRegistrationResponse;
import com.gaurav.CarPoolingApplication_SATHI.Exception.DuplicateEntryException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverVerificationStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.EmergencyContactEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.DriverEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.EmergencyContactRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
public class UserServiceImplementation implements UserService, AuthService {
    private final DriverEntityRepository driverEntityRepository;
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
    // Secure random generator for OTP
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    // Max file size for profile photo (5 MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    // Allowed file types for profile photo
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9][0-9]{9}$");
    // Redis keys and settings for OTP rate limiting
    private static final String USER_OTP_CACHE_PREFIX = "user:otp:val:";
    private static final String USER_OTP_REQ_COUNT_PREFIX = "user:otp:req:";
    private static final long OTP_TTL_MINUTES = 5;
    private static final long OTP_RATE_LIMIT_MINUTES = 15;
    private static final int MAX_OTP_REQUESTS = 3;
    public UserServiceImplementation(
        DriverEntityRepository driverEntityRepository,
        JavaMailSender javaMailSender,
        EmergencyContactRepository emergencyContactRepository,
        Cloudinary cloudinary,
        PasswordEncoder passwordEncoder,
        UserEntityRepository userEntityRepository,
        RedisTemplate<String, Object> redisTemplate) {
            this.driverEntityRepository = driverEntityRepository;
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
        boolean isEmailExist = this.userEntityRepository
                .findByEmail(request.getEmail()).isPresent();
        if(isEmailExist)
            throw new DuplicateEntryException("Email already registered.");
        if(!PHONE_PATTERN.matcher(request.getPhoneNumber()).matches())
            throw new IllegalArgumentException("Invalid phone number format.");
        boolean isPhoneExist = this.userEntityRepository
                .findByPhoneNumber(request.getPhoneNumber()).isPresent();
        if(isPhoneExist)
            throw new DuplicateEntryException("Phone number already registered.");
        UserEntity user = UserEntity.builder()
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
    @Override @Transactional
    public UserProfileDTO getUserProfileByEmail(String email) {
        String cacheKey = USER_PROFILE_CACHE_PREFIX + email;
        // Try to get from Redis cache
        UserProfileDTO cachedProfile = (UserProfileDTO) redisTemplate.opsForValue().get(cacheKey);
        if (cachedProfile != null) 
            return cachedProfile;
        // Cache miss — fetch from database
        UserProfileDTO profileDTO = this.userEntityRepository.findUserProfileByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        List<EmergencyContactDTO> emergencyContacts = this.emergencyContactRepository
                    .findEmergencyContactsByEmail(email);
        profileDTO.setEmergencyContacts(
            emergencyContacts != null ? emergencyContacts : new ArrayList<>());
        // Store in Redis with TTL (auto-expires after 30 minutes)
        redisTemplate.opsForValue().set(cacheKey, profileDTO, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        return profileDTO;
    }
    // Upload or replace the user's profile photo on Cloudinary
    // Uses a fixed public_id per user so re-uploads always REPLACE the old image
    @Override @Transactional
    public String uploadProfilePhoto(String email, MultipartFile file) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        validateUserAccountStatus(user);
        if (file.isEmpty())
            throw new IllegalArgumentException("File is empty.");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new IllegalArgumentException("File size exceeds 5 MB limit.");
        if (!ALLOWED_TYPES.contains(file.getContentType()))
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP images are allowed.");
        // Build a deterministic public_id so the same user always overwrites the same image
        String publicId = "user/" + user.getUserId() + "/profile";
        String profileUrl = null;
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
            profileUrl = (String) result.get("secure_url");
        } catch (Exception e) {
            log.error("Profile photo upload failed for user", e);
            throw new RuntimeException("Profile photo upload failed");
        }
        try {
            user.setProfilePictureUrl(profileUrl);
            user.setAccountUpdatedAt(LocalDateTime.now());
            this.userEntityRepository.save(user);
            redisTemplate.delete(USER_PROFILE_CACHE_PREFIX + email);
            log.info("Profile photo updated successfully for user: {}", user.getUserFullName());
            return profileUrl;
        } catch (Exception e) {
            // DB save failed — but image IS on Cloudinary → rollback needed
            log.error("DB save failed after Cloudinary upload for user: {}", email, e);
            try {
                cloudinary.uploader().destroy("profile_photos/" + publicId, Map.of());
                log.info("Cloudinary rollback successful for user: {}", email);
        } catch (Exception ex) {
            // Orphan image left on Cloudinary — log for manual cleanup
            log.error("MANUAL CLEANUP NEEDED — orphan image at public_id: profile_photos/{}", publicId, ex);
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
            if(!PHONE_PATTERN.matcher(request.getPhoneNumber()).matches())
                throw new IllegalArgumentException("Invalid phone number format.");
            if(this.userEntityRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent())
                throw new DuplicateEntryException("Phone number already exists.");
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if(request.getEmergencyContacts() != null && !request.getEmergencyContacts().isEmpty()){
            List<EmergencyContactEntity> existingContacts = user.getEmergencyContacts();
            int totalAfterMerge = existingContacts.size() + request.getEmergencyContacts().size();
            if (totalAfterMerge > 3)
                throw new IllegalArgumentException(
                    "Maximum 3 emergency contacts allowed. You currently have " 
                    + existingContacts.size() + ".");
            final UserEntity finalUser = user;
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
        this.redisTemplate.delete(USER_PROFILE_CACHE_PREFIX + email);
        return this.getUserProfileByEmail(email);
    }
    // delete emergency contact number
    @Override
    @Transactional
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
        this.redisTemplate.delete(USER_PROFILE_CACHE_PREFIX + email);
    }
    // change account password
    @Override
    @Transactional
    public void changeAccountPassword(String email, ChangePasswordRequest request) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        if(request.getNewPassword().length() < 8)
            throw new IllegalArgumentException("New password must be at least 8 characters long.");
        if(!passwordEncoder.matches(request.getOldPassword(), user.getPassword()))
            throw new AccessDeniedException("Old password not matched.");
        if(passwordEncoder.matches(request.getNewPassword(), user.getPassword()))
            throw new IllegalArgumentException("New password cannot be same as old password.");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setAccountUpdatedAt(LocalDateTime.now());
            this.userEntityRepository.save(user);
            this.redisTemplate.delete(USER_PROFILE_CACHE_PREFIX + email);
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
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(email);
            mailMessage.setSubject("OTP for Password Reset");
            mailMessage.setText("Your 6-digit verification code is: " + otp +
                            "\nThis code is valid for " + OTP_TTL_MINUTES + " minutes.");
            javaMailSender.send(mailMessage);
        } catch (Exception e) {
            redisTemplate.delete(otpKey);
            log.error("Failed to send OTP email for user: {}", email, e);
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
        log.info("Generated OTP for {}", user.getUserFullName());
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
    // get user roles
    @Override
    public Set<UserRole> getUserRoles(String email) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        validateUserAccountStatus(user);
        return user.getUserRoles();
    }
    // register driver
    @Override
    public DriverRegistrationResponse registerDriver(String email, DriverRegistrationRequest request) {
        UserEntity user = this.userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found."));
        if(user.getProfilePictureUrl() == null || user.getProfilePictureUrl().isBlank())
            throw new IllegalArgumentException("Profile picture is required. Please upload your photo first.");
        validateUserAccountStatus(user);
        boolean isProfileExist = this.driverEntityRepository.findByUserEmail(email).isPresent();
        if(isProfileExist)
            throw new DuplicateEntryException("Driver profile already registered.");
        boolean isLicenseNumberExist = this.driverEntityRepository.existsByLicenseNumber(request.getLicenseNumber());
        if(isLicenseNumberExist)
            throw new DuplicateEntryException("License number already exists.");
        boolean isVehicleNumberExist = this.driverEntityRepository.existsByVehicleNumber(request.getVehicleNumber());
        if(isVehicleNumberExist)
            throw new DuplicateEntryException("Vehicle number already exists.");
        VehicleClass vehicleClass = parseEnum(VehicleClass.class, request.getVehicleClass());
        VehicleCategory vehicleCategory = parseEnum(VehicleCategory.class, request.getVehicleCategory());
        DriverProfileEntity driverProfileEntity = DriverProfileEntity.builder()
            .user(user)
            .licenseNumber(request.getLicenseNumber())
            .licenseExpirationDate(request.getLicenseExpirationDate())
            .vehicleModel(request.getVehicleModel())
            .vehicleNumber(request.getVehicleNumber())
            .vehicleSeatCapacity(request.getVehicleSeatCapacity())
            .vehicleCategory(vehicleCategory)
            .vehicleClass(vehicleClass)
            .driverAvailabilityStatus(DriverAvailabilityStatus.OFF_DUTY)
            .driverVerificationStatus(DriverVerificationStatus.PENDING)
            .totalCompletedRides(0)
            .totalCancelledRides(0)
            .registeredAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        user.getUserRoles().add(UserRole.DRIVER);
        this.userEntityRepository.save(user);
        DriverProfileEntity savedDriverProfile = this.driverEntityRepository.save(driverProfileEntity);
        return DriverRegistrationResponse.builder()
            .licenseNumber(savedDriverProfile.getLicenseNumber())
            .licenseExpirationDate(savedDriverProfile.getLicenseExpirationDate())
            .vehicleModel(savedDriverProfile.getVehicleModel())
            .vehicleNumber(savedDriverProfile.getVehicleNumber())
            .vehicleSetCapacity(savedDriverProfile.getVehicleSeatCapacity())
            .vehicleCategory(savedDriverProfile.getVehicleCategory())
            .vehicleClass(savedDriverProfile.getVehicleClass())
            .driverAvailabilityStatus(savedDriverProfile.getDriverAvailabilityStatus())
            .driverVerificationStatus(savedDriverProfile.getDriverVerificationStatus())
            .totalCompletedRides(savedDriverProfile.getTotalCompletedRides())
            .totalCancelledRides(savedDriverProfile.getTotalCancelledRides())
            .registeredAt(savedDriverProfile.getRegisteredAt())
            .build();
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
    // helper methods
    // validate User account
    private void validateUserAccountStatus(UserEntity user) {
        if (user.getAccountStatus() == UserAccountStatus.INACTIVE)
            throw new AccessDeniedException("User account is inactive. Please verify your account first.");
        if (user.getAccountStatus() == UserAccountStatus.SUSPENDED)
            throw new AccessDeniedException("User account is suspended by ADMIN.");
        if (user.getAccountStatus() == UserAccountStatus.DELETED)
            throw new AccessDeniedException("User account is deleted.");
    }
    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}
