package com.app.service;

import com.app.dto.card.CardResponse;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.Payment;
import com.app.models.PaymentStatus;
import com.app.models.Registration;
import com.app.models.RegistrationStatus;
import com.app.repository.CardRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final RegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final CardRepository cardRepository;
    private final ClassroomRepository classroomRepository;

    @Transactional
    public CardResponse enroll(Long registrationId) {
        if (registrationId == null) {
            throw new IllegalArgumentException("Đăng ký không được để trống.");
        }

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đăng ký có id: " + registrationId
                ));

        return cardRepository.findByRegistrationId(registrationId)
                .map(this::toResponse)
                .orElseGet(() -> createCardAndEnroll(registration));
    }

    private CardResponse createCardAndEnroll(Registration registration) {
        if (registration.getStatus() != RegistrationStatus.PAID) {
            throw new IllegalArgumentException(
                    "Chỉ đăng ký đã nộp đủ học phí mới được xếp lớp/cấp thẻ."
            );
        }

        Payment payment = paymentRepository.findByRegistrationId(registration.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Đăng ký này chưa có phiếu thu học phí."
                ));
        if (payment.getStatus() != PaymentStatus.PAID
                || payment.getPaidAmount().compareTo(payment.getFinalAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Học viên chưa nộp đủ học phí."
            );
        }

        Classroom classroom = registration.getClassroom();
        int currentCapacity = classroom.getCurrentCapacity() == null ? 0 : classroom.getCurrentCapacity();
        int maxCapacity = classroom.getMaxCapacity() == null ? 0 : classroom.getMaxCapacity();
        if (maxCapacity > 0 && currentCapacity >= maxCapacity) {
            throw new IllegalArgumentException(
                    "Lớp đã đủ sĩ số, không thể xếp thêm học viên."
            );
        }

        int totalSession = registration.getClassroom().getCourse().getSession();
        LocalDate issuedDate = LocalDate.now();
        LocalDate expiredDate = classroom.getEndDate() != null
                ? classroom.getEndDate()
                : issuedDate.plusYears(1);

        Card card = Card.builder()
                .registration(registration)
                .session(totalSession)
                .remainingSession(totalSession)
                .issuedDate(issuedDate)
                .expiredDate(expiredDate)
                .status("ACTIVE")
                .build();

        classroom.setCurrentCapacity(currentCapacity + 1);
        registration.setStatus(RegistrationStatus.ENROLLED);

        classroomRepository.save(classroom);
        registrationRepository.save(registration);
        return toResponse(cardRepository.save(card));
    }

    private CardResponse toResponse(Card card) {
        Registration registration = card.getRegistration();
        Classroom classroom = registration.getClassroom();

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
                .build();
    }
}
