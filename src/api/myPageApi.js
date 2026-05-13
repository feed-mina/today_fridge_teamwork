import api from "@/config/axios";
import { unwrapApiData } from "@/api/utils";

export async function requestHealthPreferenceSave(payload) {
    const response = await api.put("/v1/users/me/conditions", payload);
    return response.data.data;
}

/**
 * 신체 정보 추가
 * @param {Object} payload { heightCm, weightKg, age, gender }
 */
export async function addPhysicalMetrics(payload) {
    const response = await api.post("/v1/user-profile/add", payload);
    return unwrapApiData(response);
}

/**
 * 신체 정보 수정
 * @param {Object} payload { heightCm, weightKg, age, gender }
 */
export async function updatePhysicalMetrics(payload) {
    const response = await api.post("/v1/user-profile/alter", payload);
    return unwrapApiData(response);
}

/**
 * 신체 정보 삭제
 */
export async function deletePhysicalMetrics() {
    const response = await api.post("/v1/user-profile/delete");
    return unwrapApiData(response);
}