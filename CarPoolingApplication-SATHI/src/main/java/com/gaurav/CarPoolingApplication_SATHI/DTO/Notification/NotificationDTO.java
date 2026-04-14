package com.gaurav.CarPoolingApplication_SATHI.DTO.Notification;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Long notificationId;
    private String message;
    private String type;
    private Long relatedEntityId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
