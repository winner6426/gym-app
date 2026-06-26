package com.app.service;

import com.app.dto.center.CenterRequest;
import com.app.dto.center.CenterResponse;
import com.app.exception.DuplicateResourceException;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Center;
import com.app.repository.CenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CenterService {

    private final CenterRepository centerRepository;

    public List<CenterResponse> getAll() {
        return centerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CenterResponse getById(Long id) {
        return toResponse(findCenter(id));
    }

    public List<CenterResponse> getByProvince(String province) {
        return centerRepository.findByProvince(province.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CenterResponse create(CenterRequest request) {
        validateRequest(request);

        String name = request.getName().trim();
        String province = request.getProvince().trim();
        String address = request.getAddress().trim();

        if(centerRepository.existsByAddress(address)) {
            throw new DuplicateResourceException("Cơ sở tại địa chỉ này đã tồn tại.");
        }
        if(centerRepository.existsByName(name)) {
            throw new DuplicateResourceException("Tên cơ sở này đã tồn tại.");
        }

        Center center = Center.builder()
                .name(name)
                .province(province)
                .address(address)
                .phone(trimToNull(request.getPhone()))
                .build();

        return toResponse(centerRepository.save(center));
    }

    public CenterResponse update(Long id, CenterRequest request) {
        validateRequest(request);

        Center center = findCenter(id);
        String name = request.getName().trim();
        String province = request.getProvince().trim();
        String address = request.getAddress().trim();

        boolean changedIdentity = !center.getName().equalsIgnoreCase(name) || !center.getAddress().equalsIgnoreCase(address);

        if (changedIdentity
                && centerRepository.existsByAddress(address)) {
            throw new DuplicateResourceException("Cơ sở tại địa chỉ này đã tồn tại.");
        }
        if (changedIdentity
                && centerRepository.existsByName(name)) {
            throw new DuplicateResourceException("Tên cơ sở này đã tồn tại.");
        }


        center.setName(name);
        center.setProvince(province);
        center.setAddress(address);
        center.setPhone(trimToNull(request.getPhone()));

        return toResponse(centerRepository.save(center));
    }

    public void delete(Long id) {
        centerRepository.delete(findCenter(id));
    }

    private Center findCenter(Long id) {
        return centerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy cơ sở có id: " + id
                ));
    }

    private CenterResponse toResponse(Center center) {
        return CenterResponse.builder()
                .id(center.getId())
                .name(center.getName())
                .province(center.getProvince())
                .address(center.getAddress())
                .phone(center.getPhone())
                .build();
    }

    private void validateRequest(CenterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu không được để trống.");
        }
        if (isBlank(request.getName())) {
            throw new IllegalArgumentException("Tên cơ sở không được để trống.");
        }
        if (isBlank(request.getProvince())) {
            throw new IllegalArgumentException("Tỉnh/thành phố không được để trống.");
        }
        if (isBlank(request.getAddress())) {
            throw new IllegalArgumentException("Địa chỉ không được để trống.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
