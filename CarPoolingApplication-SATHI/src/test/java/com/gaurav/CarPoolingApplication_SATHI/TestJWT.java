package com.gaurav.CarPoolingApplication_SATHI;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.*;
import javax.crypto.SecretKey;
public class TestJWT {
    public static void main(String[] args) {
        try {
            SecretKey secretKey = Keys.hmacShaKeyFor("9f3c7b6e4a1d8c2f5e9a7b3c1d6f8e2a4c9b7d5f3a1e8c6b2d4f7a9c3e5b1d8f".getBytes());
            Map<String, Object> claims = new HashMap<>();
            claims.put("roles", Arrays.asList("ROLE_USER"));
            String token = Jwts.builder()
                .setClaims(claims)
                .setSubject("test@test.com")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 100000))
                .signWith(secretKey)
                .compact();
            System.out.println("Token: " + token);
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}
