import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  requestHealthPreferenceSave,
  addPhysicalMetrics,
  updatePhysicalMetrics,
  deletePhysicalMetrics,
} from '@/api/myPageApi';
import api from '@/config/axios';

vi.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('myPageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('requestHealthPreferenceSave: PUT /v1/users/me/conditions 에 payload를 전송한다', async () => {
    api.put.mockResolvedValue({ data: { success: true, data: { status: 'success' } } });

    const payload = { diet: true };
    const res = await requestHealthPreferenceSave(payload);

    expect(api.put).toHaveBeenCalledWith('/v1/users/me/conditions', payload);
    expect(res).toEqual({ status: 'success' });
  });

  test('addPhysicalMetrics: POST /v1/user-profile/add 에 payload를 전송한다', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: null, message: 'added' } });

    const payload = { heightCm: 180, weightKg: 75, age: 25, gender: 'M' };
    const res = await addPhysicalMetrics(payload);

    expect(api.post).toHaveBeenCalledWith('/v1/user-profile/add', payload);
    expect(res).toBe(null);
  });

  test('updatePhysicalMetrics: POST /v1/user-profile/alter 에 payload를 전송한다', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: null, message: 'updated' } });

    const payload = { heightCm: 181 };
    const res = await updatePhysicalMetrics(payload);

    expect(api.post).toHaveBeenCalledWith('/v1/user-profile/alter', payload);
    expect(res).toBe(null);
  });

  test('deletePhysicalMetrics: POST /v1/user-profile/delete 를 호출한다', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: null, message: 'deleted' } });

    const res = await deletePhysicalMetrics();

    expect(api.post).toHaveBeenCalledWith('/v1/user-profile/delete');
    expect(res).toBe(null);
  });
});

