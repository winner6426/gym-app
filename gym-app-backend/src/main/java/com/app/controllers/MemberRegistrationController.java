package com.app.controllers;

import com.app.dto.registration.CreateRegistrationRequest;
import com.app.dto.registration.RegistrationResponse;
import com.app.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/member/registrations")
@RequiredArgsConstructor
public class MemberRegistrationController {

    private final RegistrationService registrationService;

    @GetMapping
    public List<RegistrationResponse> getMine(@RequestParam Long userId) {
        return registrationService.getByMember(userId);
    }

    @PostMapping
    public ResponseEntity<RegistrationResponse> create(
            @RequestBody CreateRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.create(request));
    }

    @PatchMapping("/{id}/cancel")
    public RegistrationResponse cancel(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return registrationService.cancel(id, userId);
    }
}
