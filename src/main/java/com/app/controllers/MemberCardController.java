package com.app.controllers;

import com.app.dto.card.CardResponse;
import com.app.dto.registration.RefundInfo;
import com.app.dto.registration.RegistrationResponse;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.Payment;
import com.app.models.Registration;
import com.app.repository.CardRepository;
import com.app.repository.PaymentRepository;
import com.app.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/member/cards")
@RequiredArgsConstructor
public class MemberCardController {

    private final CardRepository cardRepository;
    private final PaymentRepository paymentRepository;
    private final RegistrationService registrationService;

    @GetMapping
    public List<CardResponse> getMyCards(@RequestParam Long userId) {
        return cardRepository
                .findByRegistrationUserIdOrderByIssuedDateDescIdDesc(userId)
                .stream()
                .filter(card -> !"CANCELLED".equals(card.getStatus()))
                .filter(card -> card.getRegistration().getStatus() != com.app.models.RegistrationStatus.CANCELLED)
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{cardId}/cancellation-request")
    public RegistrationResponse requestCancellation(
            @PathVariable Long cardId,
            @RequestParam Long userId) {
        return registrationService.requestClassCancellation(cardId, userId);
    }

    private CardResponse toResponse(Card card) {
        Registration registration = card.getRegistration();
        Classroom classroom = registration.getClassroom();
        Payment payment = paymentRepository.findByRegistration(registration).orElse(null);
        RefundInfo refundInfo = registrationService.calculateRefundInfo(card, payment);

        return CardResponse.builder()
                .id(card.getId())
                .registrationId(registration.getId())
                .studentId(registration.getUser().getId())
                .studentName(registration.getUser().getName())
                .studentEmail(registration.getUser().getEmail())
                .studentPhone(registration.getUser().getPhoneNumber())
                .classroomId(classroom.getId())
                .classroomCode(classroom.getCode())
                .classroomName(classroom.getName())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .trainerName(classroom.getTrainer().getName())
                .session(card.getSession())
                .remainingSession(card.getRemainingSession())
                .issuedDate(card.getIssuedDate())
                .expiredDate(card.getExpiredDate())
                .status(card.getStatus())
                .registrationStatus(registration.getStatus().name())
                .paidAmount(payment == null ? null : payment.getPaidAmount())
                .refundPercent(refundInfo.getRefundPercent())
                .refundAmount(refundInfo.getRefundAmount())
                .refundPolicyMessage(refundInfo.getMessage())
                .build();
    }
}
