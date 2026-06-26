package com.app.controllers;

import com.app.dto.payment.PaymentCollectionResponse;
import com.app.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/member/payments")
@RequiredArgsConstructor
public class MemberPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public List<PaymentCollectionResponse> getMyPayments(@RequestParam Long userId) {
        return paymentService.getMyPayments(userId);
    }
}
