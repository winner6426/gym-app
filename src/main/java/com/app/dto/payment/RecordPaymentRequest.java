package com.app.dto.payment;

import com.app.models.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RecordPaymentRequest {
    private Long registrationId;
    private Long staffId;
    private BigDecimal amountReceived;
    private PaymentMethod paymentMethod;
    private String transactionCode;
}
