package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {
    private String userFullName;
    private String gender;
    private String bio;
    private String phoneNumber;
    List<EmergencyContactDTO> emergencyContacts;
}
