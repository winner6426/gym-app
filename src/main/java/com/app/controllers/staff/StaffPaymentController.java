package com.app.controllers.staff;

import com.app.dto.card.CardResponse;
import com.app.dto.payment.PaymentCollectionResponse;
import com.app.dto.payment.RecordPaymentRequest;
import com.app.service.EnrollmentService;
import com.app.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff/payments")
@RequiredArgsConstructor
public class StaffPaymentController {

    private final PaymentService paymentService;
    private final EnrollmentService enrollmentService;

    @GetMapping
    public List<PaymentCollectionResponse> getCollectibleRegistrations() {
        return paymentService.getCollectibleRegistrations();
    }

    @PostMapping("/record")
    public PaymentCollectionResponse record(@RequestBody RecordPaymentRequest request) {
        return paymentService.record(request);
    }

    @PostMapping("/enroll/{registrationId}")
    public CardResponse enroll(@PathVariable Long registrationId) {
        return enrollmentService.enroll(registrationId);
    }
}
