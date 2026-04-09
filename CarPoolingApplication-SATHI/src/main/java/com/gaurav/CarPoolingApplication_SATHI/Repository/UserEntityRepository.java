package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
@Repository
public interface UserEntityRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByPhoneNumber(String phoneNumber);
    Optional<UserEntity> findByEmailAndPhoneNumber(String email, String phoneNumber);
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.UserProfileDTO(
                user.userId,
                user.userFullName,
                user.email,
                user.phoneNumber,
                user.accountStatus,
                user.accountCreatedAt,
                user.accountUpdatedAt,
                user.profilePictureUrl,
                user.gender,
                user.bio,
                user.averageRating,
                user.totalRatingsCount,
                user.totalRidesCompleted,
                user.isEmailVerified
            )
            FROM UserEntity user
            WHERE user.email = :email
            """)
    Optional<UserProfileDTO> findUserProfileByEmail(String email);
}
