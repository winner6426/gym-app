package com.app.controllers.auth;

import com.app.dto.auth.AuthResponse;
import com.app.dto.user.UpdateUserRequest;
import com.app.dto.user.UserResponse;
import com.app.security.JwtService;
import com.app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final JwtService jwtService;

    @GetMapping("/profile")
    public UserResponse getProfile(Authentication authentication) {
        return userService.getByEmail(authentication.getName());
    }

    @PutMapping("/profile")
    public AuthResponse updateProfile(
            Authentication authentication,
            @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateByEmail(authentication.getName(), request);
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .user(user)
                .build();
    }
}
