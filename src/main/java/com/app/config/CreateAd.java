package com.app.config;

import com.app.models.User;
import com.app.models.Role;
import com.app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CreateAd { //implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /*@Override
    public void run(String... args) throws Exception {
        User admin = User.builder()
                .email("admin123@gmail.com")
                .password(passwordEncoder.encode("admin123"))
                .name("admin")
                .phoneNumber("0123456789")
                .role(Role.ADMIN)
                .disabled(false)
                .build();

        userRepository.save(admin);
        System.out.println("Create admin successfully");
    }*/
}
