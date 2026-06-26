package com.app.repository;

import com.app.models.Measurement;
import com.app.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
    List<Measurement> findByUser(User user);

    boolean existsByUserId(Long userId);
}
