package com.app.controllers;

import com.app.dto.makeup.MakeupRequestCreateRequest;
import com.app.dto.makeup.MakeupRequestResponse;
import com.app.service.MakeupRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/member/makeup-requests")
@RequiredArgsConstructor
public class MemberMakeupRequestController {

    private final MakeupRequestService makeupRequestService;

    @GetMapping
    public List<MakeupRequestResponse> getMyRequests(@RequestParam Long userId) {
        return makeupRequestService.getMyRequests(userId);
    }

    @PostMapping
    public MakeupRequestResponse create(@RequestBody MakeupRequestCreateRequest request) {
        return makeupRequestService.create(request);
    }
}
