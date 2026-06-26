package com.app.repository;

import com.app.models.RegistrationAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationAvailabilityRepository
        extends JpaRepository<RegistrationAvailability, Long> {

    List<RegistrationAvailability> findByRegistrationId(Long registrationId);
}
