package com.gaurav.CarPoolingApplication_SATHI.DTO.RideDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RideRequestDTO {
    @NotNull(message = "Source latitude is required")
    private Double sourceLat;

    @NotNull(message = "Source longitude is required")
    private Double sourceLong;

    @NotBlank(message = "Boarding address is required")
    private String boardingAddress;

    private String sourcePlaceName;

    @NotNull(message = "Destination latitude is required")
    private Double destinationLat;

    @NotNull(message = "Destination longitude is required")
    private Double destinationLong;

    @NotBlank(message = "Destination address is required")
    private String destinationAddress;

    private String destinationPlaceName;

    @NotNull(message = "Departure time is required")
    @jakarta.validation.constraints.FutureOrPresent(message = "Departure time must be in the future or present")
    private LocalDateTime departureTime;

    @NotNull(message = "Available seats is required")
    @Min(value = 1, message = "At least 1 seat must be available")
    private Integer availableSeats;

    private String routePath;

    private Double totalDistanceKm;

    @NotNull(message = "Price per KM is required")
    @DecimalMin(value = "1.0", message = "Price per KM must be at least ₹1.0")
    private BigDecimal pricePerKm;
}
