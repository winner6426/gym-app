package com.app.dto.payment;

import com.app.models.PaymentMethod;
import com.app.models.PaymentStatus;
import com.app.models.RegistrationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCollectionResponse {
    private Long paymentId;
    private Long registrationId;
    private RegistrationStatus registrationStatus;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String classroomCode;
    private String classroomName;
    private String courseName;
    private String centerName;
    private BigDecimal originalAmount;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal refundPercent;
    private BigDecimal refundAmount;
    private BigDecimal remainingAmount;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String transactionCode;
    private LocalDateTime paymentDate;
    private String collectedByName;
}
