package com.gaurav.CarPoolingApplication_SATHI.Model.RideEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.DriverProfileEntity;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleCategory;
import com.gaurav.CarPoolingApplication_SATHI.Model.DriverProfileEntity.VehicleClass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
@AllArgsConstructor @NoArgsConstructor
@Builder
@Getter @Setter
@Entity
@Table(name = "rides")
public class RideEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rideId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private DriverProfileEntity driverProfileEntity;
    @Column(nullable = false)
    private Double sourceLat;
    @Column(nullable = false)
    private Double sourceLng;
    @Column(nullable = false)
    private String sourceAddress;
    @Column(nullable = false)
    private Double destinationLat;
    @Column(nullable = false)
    private Double destinationLng;
    private String destinationAddress;
    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private VehicleClass vehicleClass;
    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private VehicleCategory vehicleCategory;
    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private RideStatus rideStatus;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedDistanceOfRide;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal actualDistanceOfRide;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseFare;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerKm;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedFare;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal systemCommission;
    @Column(precision = 10, scale = 2)
    private BigDecimal totalDriverShare;
    @Column(precision = 10, scale = 2)
    private BigDecimal actualFare;
    @Column(nullable = false)
    private Integer totalAvailableSeats;
    @Column(nullable = false)
    private Integer offeredSeats;
    private Integer totalPassengersSharedRide;
    @Column(nullable = false)
    private LocalDateTime rideDepartureTime;
    private LocalDateTime rideCompletiontime;
    private LocalDateTime rideCreatedAt;
    private LocalDateTime rideUpdatedAt;
    @Column(columnDefinition = "TEXT")
    private String routePath;
}
