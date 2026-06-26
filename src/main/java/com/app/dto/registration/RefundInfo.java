package com.app.dto.registration;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RefundInfo {
    private BigDecimal refundPercent;
    private BigDecimal refundAmount;
    private String message;
}
