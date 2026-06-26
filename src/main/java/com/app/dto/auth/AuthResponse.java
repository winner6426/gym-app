package com.app.dto.auth;

import com.app.dto.user.UserResponse;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;

@Getter
@Setter
@Builder
public class AuthResponse {
    private String token;
    private UserResponse user;
}
