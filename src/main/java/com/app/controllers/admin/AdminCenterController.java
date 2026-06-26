package com.app.controllers.admin;

import com.app.dto.center.CenterRequest;
import com.app.dto.center.CenterResponse;
import com.app.service.CenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/centers")
@RequiredArgsConstructor
public class AdminCenterController {
    private final CenterService centerService;

    @GetMapping
    public List<CenterResponse> getAll() {
        return centerService.getAll();
    }

    @GetMapping("/{id}")
    public CenterResponse getById(@PathVariable Long id) {
        return centerService.getById(id);
    }

    @PostMapping
    public ResponseEntity<CenterResponse> create(@RequestBody CenterRequest centerRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(centerService.create(centerRequest));
    }

    @PutMapping("/{id}")
    public CenterResponse update(
            @PathVariable Long id,
            @RequestBody CenterRequest request) {
        return centerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        centerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
