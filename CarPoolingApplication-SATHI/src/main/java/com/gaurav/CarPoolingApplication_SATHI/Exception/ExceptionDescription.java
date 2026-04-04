package com.gaurav.CarPoolingApplication_SATHI.Exception;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
public class ExceptionDescription {
    private int responseStatus;
    private String exceptionMessage;
    private LocalDateTime exceptionTimeStamp;
}
