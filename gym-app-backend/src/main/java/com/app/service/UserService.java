package com.app.service;

import com.app.dto.user.CreateUserRequest;
import com.app.dto.user.ResetUserPasswordRequest;
import com.app.dto.user.UpdateUserRequest;
import com.app.dto.user.UpdateUserRoleRequest;
import com.app.dto.user.UserResponse;
import com.app.exception.DuplicateResourceException;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Role;
import com.app.models.User;
import com.app.repository.AttendanceRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.MeasurementRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.RegistrationRepository;
import com.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;
    private final MeasurementRepository measurementRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAll(String keyword, Role role, Boolean disabled) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();

        return userRepository.findAll().stream()
                .filter(user -> role == null || user.getRole() == role)
                .filter(user -> disabled == null || user.isDisabled() == disabled)
                .filter(user -> normalizedKeyword.isBlank()
                        || contains(user.getName(), normalizedKeyword)
                        || contains(user.getEmail(), normalizedKeyword)
                        || contains(user.getPhoneNumber(), normalizedKeyword))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return toResponse(findUser(id));
    }

    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {
        return toResponse(findUserByEmail(email));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        validateCreateRequest(request);
        String email = normalizeEmail(request.getEmail());
        String phone = request.getPhoneNumber().trim();
        ensureEmailAvailable(email, null);
        ensurePhoneAvailable(phone, null);

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName().trim())
                .phoneNumber(phone)
                .role(request.getRole())
                .disabled(false)
                .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        validateUpdateRequest(request);
        User user = findUser(id);
        String email = normalizeEmail(request.getEmail());
        String phone = request.getPhoneNumber().trim();
        ensureEmailAvailable(email, id);
        ensurePhoneAvailable(phone, id);

        user.setEmail(email);
        user.setName(request.getName().trim());
        user.setPhoneNumber(phone);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateByEmail(String currentEmail, UpdateUserRequest request) {
        validateUpdateRequest(request);
        User user = findUserByEmail(currentEmail);
        String email = normalizeEmail(request.getEmail());
        String phone = request.getPhoneNumber().trim();
        ensureEmailAvailable(email, user.getId());
        ensurePhoneAvailable(phone, user.getId());

        user.setEmail(email);
        user.setName(request.getName().trim());
        user.setPhoneNumber(phone);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateUserRoleRequest request) {
        if (request == null || request.getRole() == null) {
            throw new IllegalArgumentException("Vai trò không được để trống.");
        }
        User user = findUser(id);
        user.setRole(request.getRole());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse setDisabled(Long id, boolean disabled) {
        User user = findUser(id);
        user.setDisabled(disabled);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long id, ResetUserPasswordRequest request) {
        if (request == null || request.getPassword() == null
                || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        User user = findUser(id);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = findUser(id);
        ensureUserCanBeDeleted(id);
        userRepository.delete(user);
    }

    private void ensureUserCanBeDeleted(Long id) {
        if (classroomRepository.existsByTrainerId(id)) {
            throw new IllegalArgumentException("Người dùng đang phụ trách lớp học. Hãy đổi huấn luyện viên hoặc khóa tài khoản thay vì xóa.");
        }
        if (registrationRepository.existsByUserId(id)) {
            throw new IllegalArgumentException("Người dùng đã có đăng ký/thẻ học. Hãy khóa tài khoản để giữ dữ liệu lịch sử.");
        }
        if (attendanceRepository.existsByStudentId(id)) {
            throw new IllegalArgumentException("Người dùng đã có dữ liệu điểm danh. Hãy khóa tài khoản để giữ dữ liệu lịch sử.");
        }
        if (paymentRepository.existsByCollectedById(id)) {
            throw new IllegalArgumentException("Người dùng đã liên quan đến giao dịch thanh toán. Hãy khóa tài khoản để giữ dữ liệu lịch sử.");
        }
        if (measurementRepository.existsByUserId(id)) {
            throw new IllegalArgumentException("Người dùng đã có dữ liệu hồ sơ/chỉ số. Hãy khóa tài khoản để giữ dữ liệu lịch sử.");
        }
    }

    private void ensureEmailAvailable(String email, Long excludedId) {
        boolean exists = excludedId == null
                ? userRepository.existsByEmailIgnoreCase(email)
                : userRepository.existsByEmailIgnoreCaseAndIdNot(email, excludedId);
        if (exists) throw new DuplicateResourceException("Email đã tồn tại.");
    }

    private void ensurePhoneAvailable(String phone, Long excludedId) {
        boolean exists = excludedId == null
                ? userRepository.existsByPhoneNumber(phone)
                : userRepository.existsByPhoneNumberAndIdNot(phone, excludedId);
        if (exists) throw new DuplicateResourceException("Số điện thoại đã tồn tại.");
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng có id: " + id
                ));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng có email: " + email
                ));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .disabled(user.isDisabled())
                .createdDate(user.getCreatedDate())
                .build();
    }

    private void validateCreateRequest(CreateUserRequest request) {
        if (request == null) throw new IllegalArgumentException("Dữ liệu không được để trống.");
        validateCommon(request.getEmail(), request.getName(), request.getPhoneNumber());
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Vai trò không được để trống.");
        }
    }

    private void validateUpdateRequest(UpdateUserRequest request) {
        if (request == null) throw new IllegalArgumentException("Dữ liệu không được để trống.");
        validateCommon(request.getEmail(), request.getName(), request.getPhoneNumber());
    }

    private void validateCommon(String email, String name, String phone) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new IllegalArgumentException("Email không hợp lệ.");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên không được để trống.");
        }
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống.");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
