package com.gaurav.CarPoolingApplication_SATHI.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gaurav.CarPoolingApplication_SATHI.Model.Notification.NotificationEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
    List<NotificationEntity> findByUserAndIsReadOrderByCreatedAtDesc(UserEntity user, Boolean isRead);
    long countByUserAndIsRead(UserEntity user, Boolean isRead);
}
