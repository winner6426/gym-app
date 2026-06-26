package com.app.repository;

import com.app.models.Card;
import com.app.models.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CardRepository extends JpaRepository<Card, Long> {
    Optional<Card> findByRegistration(Registration registration);
    Optional<Card> findByRegistrationId(Long registrationId);
    List<Card> findByRegistrationUserIdOrderByIssuedDateDescIdDesc(Long userId);
}
