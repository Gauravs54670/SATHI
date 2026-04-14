package com.gaurav.CarPoolingApplication_SATHI.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gaurav.CarPoolingApplication_SATHI.DTO.Notification.NotificationDTO;
import com.gaurav.CarPoolingApplication_SATHI.Service.Notification.NotificationService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotification(Authentication authentication){
        String email = authentication.getName();
        List<NotificationDTO> notifications = notificationService.getNotificationsForUser(email);
        return new ResponseEntity<>(Map.of("data",notifications),HttpStatus.OK);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication){
        String email = authentication.getName();
        Long count = notificationService.getUnreadCount(email);
        return new ResponseEntity<>(Map.of("data",count),HttpStatus.OK);
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAllAsRead(email);
        return new ResponseEntity<>(Map.of("message","All notifications marked as read"),HttpStatus.OK);
    }

    @PutMapping("/mark-read/{id}")
    public ResponseEntity<?> markAsRead(Authentication authentication, @PathVariable Long id) {
        String email = authentication.getName();
        notificationService.markAsRead(email, id);
        return new ResponseEntity<>(Map.of("message","Notification marked as read"),HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(Authentication authentication, @PathVariable Long id) {
        String email = authentication.getName();
        notificationService.deleteNotification(email, id);
        return new ResponseEntity<>(Map.of("message","Notification deleted"),HttpStatus.OK);
    }
}
