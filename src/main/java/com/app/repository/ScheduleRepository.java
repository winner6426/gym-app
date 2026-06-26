package com.app.repository;

import com.app.models.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByClassroomId(Long classroomId);

    void deleteByClassroomId(Long classroomId);
}
