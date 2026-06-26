package com.app.repository;

import com.app.models.Payment;
import com.app.models.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRegistration(Registration registration);
    Optional<Payment> findByRegistrationId(Long registrationId);
    List<Payment> findAllByOrderByPaymentDateDescIdDesc();
    List<Payment> findByRegistrationUserIdOrderByPaymentDateDescIdDesc(Long userId);
    boolean existsByCollectedById(Long collectedById);
}
