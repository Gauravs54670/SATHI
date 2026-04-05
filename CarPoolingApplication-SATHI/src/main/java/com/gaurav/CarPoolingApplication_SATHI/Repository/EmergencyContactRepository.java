package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.EmergencyContactDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.EmergencyContactEntity;

@Repository
public interface EmergencyContactRepository extends
 JpaRepository<EmergencyContactEntity, Long> {
    @Query("""
            SELECT new com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO.EmergencyContactDTO(
                contact.id,
                contact.name,
                contact.phoneNumber
            )
            FROM EmergencyContactEntity contact
            WHERE contact.user.email = :email
            """)
    List<EmergencyContactDTO> findEmergencyContactsByEmail(String email);
}
