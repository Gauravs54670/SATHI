package com.gaurav.CarPoolingApplication_SATHI.Service.Notification;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gaurav.CarPoolingApplication_SATHI.DTO.Notification.NotificationDTO;
import com.gaurav.CarPoolingApplication_SATHI.Exception.NoEntryFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Exception.UserNotFoundException;
import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationType;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;
import com.gaurav.CarPoolingApplication_SATHI.Repository.NotificationRepository;
import com.gaurav.CarPoolingApplication_SATHI.Repository.UserEntityRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImplementation implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserEntityRepository userEntityRepository;

    @Override
    @Transactional
    public void createNotification(UserEntity user, String message, NotificationType type, Long relatedEntityId) {
        NotificationEntity notification = NotificationEntity.builder()
            .user(user)
            .message(message)
            .type(type)
            .relatedEntityId(relatedEntityId)
            .isRead(false)
            .build();
        notificationRepository.save(notification);
        log.info("Notification created for user: {} (ID: {})", user.getEmail(), notification.getNotificationId());
    }

    @Override
    public List<NotificationDTO> getNotificationsForUser(String email) {
        UserEntity user = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        UserEntity user = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        List<NotificationEntity> unread = notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(user, false);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional
    public void markAsRead(String email, Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NoEntryFoundException("Notification not found"));
        
        if (!notification.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void deleteNotification(String email, Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NoEntryFoundException("Notification not found"));
        
        if (!notification.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        
        notificationRepository.delete(notification);
    }

    @Override
    public long getUnreadCount(String email) {
        UserEntity user = userEntityRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        return notificationRepository.countByUserAndIsRead(user, false);
    }

    private NotificationDTO mapToDTO(NotificationEntity entity) {
        return NotificationDTO.builder()
            .notificationId(entity.getNotificationId())
            .message(entity.getMessage())
            .type(entity.getType().name())
            .relatedEntityId(entity.getRelatedEntityId())
            .isRead(entity.getIsRead())
            .createdAt(entity.getCreatedAt())
            .build();
    }
}
