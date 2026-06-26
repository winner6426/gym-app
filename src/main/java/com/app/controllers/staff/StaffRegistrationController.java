package com.app.controllers.staff;

import com.app.dto.registration.ProcessRegistrationRequest;
import com.app.dto.registration.RegistrationResponse;
import com.app.models.RegistrationStatus;
import com.app.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff/registrations")
@RequiredArgsConstructor
public class StaffRegistrationController {

    private final RegistrationService registrationService;

    @GetMapping
    public List<RegistrationResponse> getAll(
            @RequestParam(required = false) RegistrationStatus status) {
        return registrationService.getAllForStaff(status);
    }

    @PatchMapping("/{id}/process")
    public RegistrationResponse process(
            @PathVariable Long id,
            @RequestBody ProcessRegistrationRequest request) {
        return registrationService.process(id, request);
    }

    @PatchMapping("/{id}/confirm-cancellation")
    public RegistrationResponse confirmCancellation(
            @PathVariable Long id,
            @RequestParam Long staffId) {
        return registrationService.confirmClassCancellation(id, staffId);
    }
}
