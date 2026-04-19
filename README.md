# SATHI: Smart Automated Transport & Hitchhiking Interface

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.13-brightgreen)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-Live%20Tracking-red)](https://redis.io/)

**SATHI** is a sophisticated carpooling platform designed to enhance passenger transparency and driver efficiency. By integrating real-time GPS tracking, path-accurate routing, and comprehensive financial breakdowns, SATHI bridges the gap between hitchhikers and verified drivers heading in the same direction.

---

## 🌟 Key Features

### 🚗 For Drivers
- **Intelligent Posting**: Create rides with specific road-accurate paths using OSRM integration.
- **Seat Management**: Dynamically accept or reject passenger requests based on availability.
- **Live Lifecycle**: Transition rides from "Post" to "Ready" to "Started" with OTP-secured onboardings.
- **Financial Dashboard**: View detailed earnings including base price, distance-based fare, and commissions.

### 🚶 For Passengers
- **Location-Aware Discovery**: Find rides starting near your current location or heading towards your destination.
- **Real-time Tracking**: Watch your driver's GPS location in real-time as they approach the pickup point and during the journey.
- **Financial Transparency**: Receive a digital receipt with a breakdown of Initial Estimates vs. Final Paid Fares.
- **Secure Pickup**: Safe boarding verified via unique OTP generation.

### 🛠️ Platform & Security
- **JWT Security**: Secure, stateless authentication for all users.
- **Real-time Sync**: Redis-backed synchronization for low-latency GPS updates.
- **Responsive Layout**: Modern, high-blur dark mode UI that works seamlessly on desktop and mobile.

---

## 🏗️ Technical Architecture

### Tech Stack
-   **Backend**: Java 21, Spring Boot 3, JPA/Hibernate, MySQL, Redis.
-   **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Leaflet (Maps).
-   **External Services**: Cloudinary (profile & vehicle photos), OSRM (Routing Engine).

### Project Structure
```text
SATHI/
├── CarPoolingApplication-SATHI/       # Spring Boot Microservice
│   ├── src/main/java/com/gaurav/...
│   │   ├── Controller/                # REST Endpoints
│   │   ├── Model/                     # JPA Entities (User, Ride, Requests)
│   │   ├── Repository/                # Database Access
│   │   ├── Service/                   # Business Logic (Tracking, Financials)
│   │   └── DTO/                       # Data Transfer Objects
│   └── src/main/resources/            # App Configurations
└── CarPoolingApplication-SATHI-UI/    # Next.js Frontend
    ├── src/app/                       # Page Routing (Dashboard, Track, Post)
    ├── src/components/                # Reusable UI (Navbar, Modals, Toast)
    └── src/lib/                       # API Integration & RideTracker Logic
```

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- MySQL Server
- Redis Server

### 1. Backend Setup
1. Clone the repository and navigate to the backend folder.
2. Update `src/main/resources/application.properties` with your MySQL and Redis credentials.
3. Add your **Cloudinary** credentials to the environment or configuration.
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

### 2. Frontend Setup
1. Navigate to the `CarPoolingApplication-SATHI-UI` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📈 The Ride Lifecycle

1.  **Post**: Driver defines source, destination, and seats.
2.  **Request**: Passenger finds the ride and requests a seat.
3.  **Accept**: Driver reviews and accepts the request.
4.  **Arrive**: Driver notifies arrival; Passenger receives an OTP.
5.  **Start**: Driver verifies the OTP to officially start the journey.
6.  **Track**: Live GPS updates are synced via Redis every few seconds.
7.  **Complete**: Final distance is recorded, and a digital receipt is generated.

---

## 🗺️ Roadmap
- [ ] Implement actual Payment Gateway (Razorpay/Stripe).
- [ ] Add Rating & Review system for Drivers/Passengers.
- [ ] Containerization with Docker & Kubernetes.
- [ ] Native Mobile App (React Native).

---

## 📄 License
This project is for educational and implementation demonstration purposes. 

**Developed by Gaurav**

---
*SATHI - Building trust in every journey.*
