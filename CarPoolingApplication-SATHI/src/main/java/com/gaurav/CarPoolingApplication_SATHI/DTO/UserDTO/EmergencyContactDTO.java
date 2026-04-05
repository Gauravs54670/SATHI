package com.gaurav.CarPoolingApplication_SATHI.DTO.UserDTO;

import java.io.Serializable;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class EmergencyContactDTO implements Serializable{
    private Long contactId;
    private String name;
    private String contact;
    public EmergencyContactDTO(Long contactId, String name, String contact) {
        this.contactId = contactId;
        this.name = name;
        this.contact = contact;
    }
}
