package com.gaurav.CarPoolingApplication_SATHI.Service.Notification;

import java.util.List;

import com.gaurav.CarPoolingApplication_SATHI.DTO.Notification.NotificationDTO;
import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationType;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;

public interface NotificationService {
    void createNotification(UserEntity user, String message, NotificationType type, Long relatedEntityId);
    List<NotificationDTO> getNotificationsForUser(String email);
    void markAllAsRead(String email);
    void markAsRead(String email, Long notificationId);
    void deleteNotification(String email, Long notificationId);
    long getUnreadCount(String email);
}
