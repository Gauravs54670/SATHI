package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.io.Serializable;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class EmergencyContactDTO implements Serializable{
    private String name;
    private String contact;
    public EmergencyContactDTO(String name, String contact) {
        this.name = name;
        this.contact = contact;
    }
}
