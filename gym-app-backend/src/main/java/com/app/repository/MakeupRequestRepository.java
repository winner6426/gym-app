package com.app.repository;

import com.app.models.MakeupRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MakeupRequestRepository extends JpaRepository<MakeupRequest, Long> {
    List<MakeupRequest> findByRegistrationIdOrderByCreatedAtDescIdDesc(Long registrationId);

    long countByRegistrationIdAndAbsenceDateBetween(
            Long registrationId,
            LocalDate startOfMonth,
            LocalDate endOfMonth
    );

    long countByRegistrationUserIdAndAbsenceDateBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<MakeupRequest> findByRegistrationUserIdOrderByCreatedAtDescIdDesc(Long userId);

    List<MakeupRequest> findByStatusOrderByCreatedAtAscIdAsc(String status);
}
