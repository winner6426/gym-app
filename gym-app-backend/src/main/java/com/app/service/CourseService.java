package com.app.service;

import com.app.dto.course.CourseRequest;
import com.app.dto.course.CourseResponse;
import com.app.exception.DuplicateResourceException;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Course;
import com.app.repository.CardRepository;
import com.app.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CardRepository cardRepository;

    public List<CourseResponse> getAll(Boolean active) {
        List<Course> courses = active == null
                ? courseRepository.findAll()
                : courseRepository.findByActive(active);

        return courses.stream()
                .map(this::toResponse)
                .toList();
    }

    public CourseResponse getById(Long id) {
        return toResponse(findCourse(id));
    }

    public CourseResponse create(CourseRequest request) {
        validateRequest(request);

        String name = request.getName().trim();

        if (courseRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException(
                    "Tên khóa học đã tồn tại."
            );
        }

        Course course = Course.builder()
                .name(name)
                .description(trimToNull(request.getDescription()))
                .session(request.getSession())
                .level(request.getLevel())
                .price(request.getPrice())
                .active(true)
                .build();

        return toResponse(courseRepository.save(course));
    }

    public CourseResponse update(Long id, CourseRequest request) {
        validateRequest(request);

        Course course = findCourse(id);
        String name = request.getName().trim();

        if (courseRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateResourceException(
                    "Tên khóa học đã tồn tại."
            );
        }

        boolean structuralChange = !course.getSession().equals(request.getSession())
                || course.getLevel() != request.getLevel();
        if (structuralChange && cardRepository.countByEffectiveCourseId(course.getId()) > 0) {
            throw new IllegalArgumentException(
                    "Khong the doi so buoi hoac trinh do cua khoa hoc da co hoc vien duoc cap the."
            );
        }

        course.setName(name);
        course.setDescription(trimToNull(request.getDescription()));
        course.setSession(request.getSession());
        course.setLevel(request.getLevel());
        course.setPrice(request.getPrice());

        return toResponse(courseRepository.save(course));
    }

    public CourseResponse setActive(Long id, boolean active) {
        Course course = findCourse(id);
        course.setActive(active);

        return toResponse(courseRepository.save(course));
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khóa học có id: " + id
                ));
    }

    private void validateRequest(CourseRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu không được để trống."
            );
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException(
                    "Tên khóa học không được để trống."
            );
        }

        if (request.getLevel() == null) {
            throw new IllegalArgumentException(
                    "Trình độ không được để trống."
            );
        }

        if (request.getSession() == null || request.getSession() <= 0) {
            throw new IllegalArgumentException(
                    "Số buổi học phải lớn hơn 0."
            );
        }

        if (request.getPrice() == null
                || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Học phí phải lớn hơn 0."
            );
        }
    }

    private CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .session(course.getSession())
                .level(course.getLevel())
                .price(course.getPrice())
                .active(course.isActive())
                .build();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}
