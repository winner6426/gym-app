package com.app.controllers;

import com.app.dto.freeze.FreezeRequestResponse;
import com.app.dto.freeze.ProcessFreezeRequest;
import com.app.service.FreezeRequestService;
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
@RequestMapping("/api/staff/freeze-requests")
@RequiredArgsConstructor
public class StaffFreezeRequestController {

    private final FreezeRequestService freezeRequestService;

    @GetMapping
    public List<FreezeRequestResponse> getFreezeRequests(
            @RequestParam(required = false) String status) {
        return freezeRequestService.getAllFreezeRequests(status);
    }

    @PatchMapping("/{id}/process")
    public FreezeRequestResponse process(
            @PathVariable Long id,
            @RequestBody ProcessFreezeRequest request) {
        return freezeRequestService.process(id, request);
    }
}
