package com.app.repository;

import com.app.models.Registration;
import com.app.models.FreezeRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreezeRequestRepository extends JpaRepository<FreezeRequest, Long> {
    List<FreezeRequest> findByRegistration(Registration registration);

    List<FreezeRequest> findByRegistrationUserIdOrderByStartDateDescIdDesc(Long userId);

    List<FreezeRequest> findByRegistrationUserIdAndStatusOrderByStartDateDescIdDesc(
            Long userId,
            String status
    );
}
