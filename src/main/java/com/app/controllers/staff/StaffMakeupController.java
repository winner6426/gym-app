package com.app.controllers.staff;

import com.app.dto.makeup.*;
import com.app.service.MakeupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff/makeup")
@RequiredArgsConstructor
public class StaffMakeupController {

    private final MakeupService makeupService;

    @GetMapping
    public List<MakeupRequestResponse> getPending() {
        return makeupService.getAllPending();
    }

    @PatchMapping("/{id}/process")
    public MakeupRequestResponse process(
            @PathVariable Long id,
            @RequestBody ProcessMakeupRequest request) {
        return makeupService.process(id, request);
    }
}
