package com.app.controllers;

import com.app.dto.classroom.ClassroomResponse;
import com.app.dto.freeze.FreezeRequestCreateRequest;
import com.app.dto.freeze.FreezeRequestResponse;
import com.app.dto.freeze.ResumeCourseRequest;
import com.app.service.FreezeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/member/freeze-requests")
@RequiredArgsConstructor
public class MemberFreezeRequestController {

    private final FreezeRequestService freezeRequestService;

    @GetMapping
    public List<FreezeRequestResponse> getMyFreezeRequests(
            @RequestParam Long userId,
            @RequestParam(required = false) String status) {
        return freezeRequestService.getMyFreezeRequests(userId, status);
    }

    @PostMapping
    public FreezeRequestResponse create(@RequestBody FreezeRequestCreateRequest request) {
        return freezeRequestService.create(request);
    }

    @GetMapping("/{id}/resume-options")
    public List<ClassroomResponse> getResumeOptions(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String province) {
        return freezeRequestService.getResumeOptions(userId, id, province);
    }

    @PatchMapping("/{id}/resume")
    public FreezeRequestResponse resume(
            @PathVariable Long id,
            @RequestBody ResumeCourseRequest request) {
        return freezeRequestService.resume(id, request);
    }
}
