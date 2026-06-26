package com.app.service;

import com.app.dto.payment.PaymentCollectionResponse;
import com.app.dto.payment.RecordPaymentRequest;
import com.app.exception.ResourceNotFoundException;
import com.app.models.*;
import com.app.repository.PaymentRepository;
import com.app.repository.RegistrationRepository;
import com.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final List<RegistrationStatus> COLLECTIBLE_STATUSES = List.of(
            RegistrationStatus.WAITING_PAYMENT,
            RegistrationStatus.PAID
    );

    private static final List<RegistrationStatus> DISCOUNT_ELIGIBLE_STATUSES = List.of(
            RegistrationStatus.WAITING_PAYMENT,
            RegistrationStatus.PAID,
            RegistrationStatus.ENROLLED
    );

    private final PaymentRepository paymentRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<PaymentCollectionResponse> getCollectibleRegistrations() {
        return registrationRepository
                .findByStatusInOrderByRegistrationDateAscIdAsc(COLLECTIBLE_STATUSES)
                .stream()
                .map(this::toCollectionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentCollectionResponse> getMyPayments(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Thiếu thông tin học viên.");
        }
        return paymentRepository.findByRegistrationUserIdOrderByPaymentDateDescIdDesc(userId)
                .stream()
                .map(payment -> toResponse(payment, payment.getRegistration()))
                .toList();
    }

    @Transactional
    public PaymentCollectionResponse record(RecordPaymentRequest request) {
        validateRequest(request);

        Registration registration = registrationRepository
                .findById(request.getRegistrationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đăng ký có id: " + request.getRegistrationId()
                ));
        if (registration.getStatus() != RegistrationStatus.WAITING_PAYMENT
                && registration.getStatus() != RegistrationStatus.PAID) {
            throw new IllegalArgumentException(
                    "Chỉ đăng ký đang chờ học phí mới có thể ghi nhận thanh toán."
            );
        }

        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy nhân viên có id: " + request.getStaffId()
                ));
        if (staff.isDisabled()
                || (staff.getRole() != Role.STAFF && staff.getRole() != Role.ADMIN)) {
            throw new IllegalArgumentException(
                    "Người thu phải là nhân viên hoặc quản trị viên đang hoạt động."
            );
        }

        Payment payment = paymentRepository.findByRegistrationId(registration.getId())
                .orElseGet(() -> paymentRepository.save(createPendingPayment(registration)));

        BigDecimal newPaidAmount = payment.getPaidAmount()
                .add(request.getAmountReceived());
        if (newPaidAmount.compareTo(payment.getFinalAmount()) > 0) {
            throw new IllegalArgumentException(
                    "Số tiền nhận vượt quá số tiền còn phải thu."
            );
        }

        payment.setPaidAmount(newPaidAmount);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionCode(trimToNull(request.getTransactionCode()));
        payment.setPaymentDate(LocalDateTime.now());
        payment.setCollectedBy(staff);

        if (newPaidAmount.compareTo(payment.getFinalAmount()) == 0) {
            payment.setStatus(PaymentStatus.PAID);
            registration.setStatus(RegistrationStatus.PAID);
            registrationRepository.save(registration);
        } else {
            payment.setStatus(PaymentStatus.PARTIALLY_PAID);
        }

        return toResponse(paymentRepository.save(payment), registration);
    }

    private Payment createPendingPayment(Registration registration) {
        BigDecimal originalAmount = registration.getClassroom()
                .getCourse()
                .getPrice();
        BigDecimal discountPercent = getDiscountPercent(registration);
        BigDecimal discountAmount = originalAmount
                .multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = originalAmount.subtract(discountAmount);

        return Payment.builder()
                .registration(registration)
                .originalAmount(originalAmount)
                .discountPercent(discountPercent)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .paidAmount(BigDecimal.ZERO)
                .status(PaymentStatus.PENDING)
                .build();
    }

    private PaymentCollectionResponse toCollectionResponse(Registration registration) {
        Payment payment = paymentRepository.findByRegistrationId(registration.getId())
                .orElseGet(() -> paymentRepository.save(createPendingPayment(registration)));
        payment = refreshUnpaidPendingPayment(payment, registration);
        return toResponse(payment, registration);
    }

    private Payment refreshUnpaidPendingPayment(Payment payment, Registration registration) {
        if (payment.getStatus() != PaymentStatus.PENDING
                || payment.getPaidAmount().compareTo(BigDecimal.ZERO) != 0) {
            return payment;
        }

        BigDecimal originalAmount = registration.getClassroom().getCourse().getPrice();
        BigDecimal discountPercent = getDiscountPercent(registration);
        BigDecimal discountAmount = originalAmount
                .multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = originalAmount.subtract(discountAmount);

        if (payment.getOriginalAmount().compareTo(originalAmount) == 0
                && payment.getDiscountPercent().compareTo(discountPercent) == 0
                && payment.getDiscountAmount().compareTo(discountAmount) == 0
                && payment.getFinalAmount().compareTo(finalAmount) == 0) {
            return payment;
        }

        payment.setOriginalAmount(originalAmount);
        payment.setDiscountPercent(discountPercent);
        payment.setDiscountAmount(discountAmount);
        payment.setFinalAmount(finalAmount);
        return paymentRepository.save(payment);
    }

    private BigDecimal getDiscountPercent(Registration registration) {
        long previousRegistrations = registrationRepository.countByUserIdAndIdNotAndStatusIn(
                registration.getUser().getId(),
                registration.getId(),
                DISCOUNT_ELIGIBLE_STATUSES
        );
        return previousRegistrations >= 1 ? BigDecimal.TEN : BigDecimal.ZERO;
    }

    private PaymentCollectionResponse toResponse(
            Payment payment,
            Registration registration) {
        return PaymentCollectionResponse.builder()
                .paymentId(payment.getId())
                .registrationId(registration.getId())
                .registrationStatus(registration.getStatus())
                .studentId(registration.getUser().getId())
                .studentName(registration.getUser().getName())
                .studentEmail(registration.getUser().getEmail())
                .studentPhone(registration.getUser().getPhoneNumber())
                .classroomCode(registration.getClassroom().getCode())
                .classroomName(registration.getClassroom().getName())
                .courseName(registration.getClassroom().getCourse().getName())
                .centerName(registration.getClassroom().getCenter().getName())
                .originalAmount(payment.getOriginalAmount())
                .discountPercent(payment.getDiscountPercent())
                .discountAmount(payment.getDiscountAmount())
                .finalAmount(payment.getFinalAmount())
                .paidAmount(payment.getPaidAmount())
                .remainingAmount(payment.getFinalAmount().subtract(payment.getPaidAmount()))
                .paymentStatus(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionCode(payment.getTransactionCode())
                .paymentDate(payment.getPaymentDate())
                .collectedByName(payment.getCollectedBy() == null
                        ? null
                        : payment.getCollectedBy().getName())
                .build();
    }

    private void validateRequest(RecordPaymentRequest request) {
        if (request == null
                || request.getRegistrationId() == null
                || request.getStaffId() == null) {
            throw new IllegalArgumentException(
                    "Đăng ký và nhân viên thu phí là bắt buộc."
            );
        }
        if (request.getAmountReceived() == null
                || request.getAmountReceived().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền nhận phải lớn hơn 0."
            );
        }
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException(
                    "Phương thức thanh toán không được để trống."
            );
        }
        if (request.getPaymentMethod() != PaymentMethod.CASH
                && (request.getTransactionCode() == null
                || request.getTransactionCode().isBlank())) {
            throw new IllegalArgumentException(
                    "Mã giao dịch là bắt buộc với thanh toán không dùng tiền mặt."
            );
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
