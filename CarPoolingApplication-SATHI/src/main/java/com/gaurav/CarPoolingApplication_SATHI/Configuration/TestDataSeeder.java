package com.gaurav.CarPoolingApplication_SATHI.Configuration;

import java.time.LocalDate;

import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverAvailabilityStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverVerificationStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserAccountStatus;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserRole;
import com.gaurav.CarPoolingApplication_SATHI.Repository.DriverEntityRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TestDataSeeder implements CommandLineRunner {

    private final UserEntityRepository userRepository;
    private final DriverEntityRepository driverRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Create Driver Account
        if (userRepository.findByEmail("driver@sathi.com").isEmpty()) {
            UserEntity driverUser = UserEntity.builder()
                .userFullName("Test Driver")
                .email("driver@sathi.com")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("Test@123"))
                .gender("MALE")
                .accountStatus(UserAccountStatus.ACTIVE)
                .isEmailVerified(true)
                .userRoles(Set.of(UserRole.USER, UserRole.DRIVER, UserRole.PASSENGER))
                .profilePictureUrl("https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg") // Dummy photo
                .build();
            
            driverUser = userRepository.save(driverUser);

            DriverProfileEntity driverProfile = DriverProfileEntity.builder()
                .user(driverUser)
                .licenseNumber("DL-TEST-001")
                .licenseExpirationDate(LocalDate.now().plusYears(5))
                .vehicleModel("Toyota Fortuner")
                .vehicleNumber("KA-01-AB-1234")
                .vehicleSeatCapacity(4)
                .vehicleCategory(VehicleCategory.SUV)
                .vehicleClass(VehicleClass.ECONOMY)
                .driverAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE)
                .driverVerificationStatus(DriverVerificationStatus.VERIFIED)
                .isAdminVerified(true)
                .totalCompletedRides(0)
                .totalCancelledRides(0)
                .build();
            
            driverRepository.save(driverProfile);
            System.out.println(">>> SEEDED DRIVER: driver@sathi.com / Test@123");
        }

        // 2. Create Passenger Account
        if (userRepository.findByEmail("passenger@sathi.com").isEmpty()) {
            UserEntity passengerUser = UserEntity.builder()
                .userFullName("Test Passenger")
                .email("passenger@sathi.com")
                .phoneNumber("8765432109")
                .password(passwordEncoder.encode("Test@123"))
                .gender("FEMALE")
                .accountStatus(UserAccountStatus.ACTIVE)
                .isEmailVerified(true)
                .userRoles(Set.of(UserRole.USER, UserRole.PASSENGER))
                .build();

            userRepository.save(passengerUser);
            System.out.println(">>> SEEDED PASSENGER: passenger@sathi.com / Test@123");
        }
    }
}
