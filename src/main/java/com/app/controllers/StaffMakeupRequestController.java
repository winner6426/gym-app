package com.app.controllers;

import com.app.dto.makeup.MakeupRequestResponse;
import com.app.dto.makeup.ProcessMakeupRequest;
import com.app.service.MakeupRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/makeup-requests")
@RequiredArgsConstructor
public class StaffMakeupRequestController {

    private final MakeupRequestService makeupRequestService;

    @GetMapping
    public List<MakeupRequestResponse> getRequests(@RequestParam(required = false) String status) {
        return makeupRequestService.getAllRequests(status);
    }

    @PatchMapping("/{id}/process")
    public MakeupRequestResponse process(
            @PathVariable Long id,
            @RequestBody ProcessMakeupRequest request) {
        return makeupRequestService.process(id, request);
    }
}
