package com.app.controllers;

import com.app.dto.user.UserResponse;
import com.app.models.Role;
import com.app.models.User;
import com.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/trainers")
@RequiredArgsConstructor
public class PublicTrainerController {

    private final UserRepository userRepository;

    @GetMapping
    public List<UserResponse> getTrainers() {
        return userRepository.findByRoleAndDisabledFalseOrderByNameAsc(Role.TRAINER)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .disabled(user.isDisabled())
                .createdDate(user.getCreatedDate())
                .build();
    }
}
