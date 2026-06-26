package com.app.service;

import com.app.dto.auth.*;
import com.app.dto.user.UserResponse;
import com.app.models.Role;
import com.app.models.User;
import com.app.repository.UserRepository;
import com.app.security.JwtService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    public final PasswordEncoder passwordEncoder;

    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if(userRepository.existsByEmailIgnoreCase(email)) {
            throw new RuntimeException("Email đã tồn tại.");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Phone number already exists");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .disabled(false)
                .role(Role.MEMBER)
                .build();

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.isDisabled()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");

        }

        if(!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException("Wrong password");
        }

        String token = jwtService.generateToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .disabled(user.isDisabled())
                .createdDate(user.getCreatedDate())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }
}
