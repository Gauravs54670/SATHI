package com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.gaurav.CarPoolingApplication_SATHI.Model.UserEntity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Entity
@Table(name = "passenger_ride_requests")
public class PassengerRideRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rideRequestId;
    @ManyToOne
    @JoinColumn(name = "ride_id", nullable = false)
    private RideEntity rideEntity;
    @ManyToOne
    @JoinColumn(name = "passenger_id", nullable = false)
    private UserEntity passengerEntity;
    @Column(nullable = false)
    private Integer requestedSeats;
    @Column(nullable = false)
    private Double passengerSourceLng;
    @Column(nullable = false)
    private Double passengerSourceLat;
    @Column(nullable = false)
    private String passengerSourceLocation;
    @Column(nullable = false)
    private Double passengerDestinationLng;
    @Column(nullable = false)
    private Double passengerDestinationLat;
    @Column(nullable = false)
    private String passengerDestinationLocation;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideRequestStatus rideRequestStatus;
    @Builder.Default
    private Boolean isDriverReachedPickupLocation = false;
    @CreationTimestamp
    private LocalDateTime rideRequestedAt;
    private LocalDateTime rideCompletedAt;
}
