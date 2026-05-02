package com.gaurav.CarPoolingApplication_SATHI.Configuration;

import com.gaurav.CarPoolingApplication_SATHI.JWT.JWTUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketsConfiguration implements WebSocketMessageBrokerConfigurer {

    private final JWTUtils jwtUtils;

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // The end point of the WebSocket
        registry.addEndpoint("/ws-sathi").setAllowedOrigins("http://localhost:3000").withSockJS();
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        // The delivery of the message is done by the message broker
        registry.enableSimpleBroker("/topic", "/queue");
        // The prefix of the application
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        if (jwtUtils.validateToken(token)) {
                            String email = jwtUtils.getUsername(token);
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(email, null, new ArrayList<>());
                            accessor.setUser(auth);
                            System.out.println("[WebSocket Auth]: Authenticated user " + email);
                        }
                    }
                }
                return message;
            }
        });
    }
}
