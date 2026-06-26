package com.app.repository;

import com.app.models.Classroom;
import com.app.models.ClassroomStatus;
import com.app.models.Level;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<Classroom> findByCenterId(Long centerId);

    List<Classroom> findByCourseLevel(Level level);

    List<Classroom> findByStatus(ClassroomStatus status);

    List<Classroom> findByTrainerIdOrderByStartDateDescIdDesc(Long trainerId);

    boolean existsByTrainerId(Long trainerId);
}
