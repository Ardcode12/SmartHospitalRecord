import axiosClient from './axiosClient';

export const listDoctors = () => axiosClient.get('/doctors');
export const getDoctor = (id) => axiosClient.get(`/doctors/${id}`);
export const getDoctorAvailability = (id) => axiosClient.get(`/doctors/${id}/availability`);
export const setDoctorAvailability = (id, data) => axiosClient.post(`/doctors/${id}/availability`, data);
export const deleteDoctorAvailability = (id, slotId) => axiosClient.delete(`/doctors/${id}/availability/${slotId}`);
export const setAvailabilityOverride = (id, data) => axiosClient.post(`/doctors/${id}/availability/override`, data);
export const getFreeSlots = (id, date, hospitalId) =>
  axiosClient.get(`/doctors/${id}/free-slots`, { params: { date, hospital_id: hospitalId } });

// Hospital ↔ Doctor approval
export const listHospitalDoctors = (hospitalId, status) =>
  axiosClient.get(`/hospital/${hospitalId}/doctors`, { params: status ? { status } : {} });
export const getPendingCount = (hospitalId) =>
  axiosClient.get(`/hospital/${hospitalId}/doctors/pending-count`);
export const inviteDoctor = (hospitalId, doctorEmail) =>
  axiosClient.post(`/hospital/${hospitalId}/doctors/invite`, { doctor_email: doctorEmail });
export const approveDoctor = (hospitalId, doctorId) =>
  axiosClient.patch(`/hospital/${hospitalId}/doctors/${doctorId}/approve`);
export const rejectDoctor = (hospitalId, doctorId) =>
  axiosClient.patch(`/hospital/${hospitalId}/doctors/${doctorId}/reject`);
export const revokeDoctor = (hospitalId, doctorId) =>
  axiosClient.patch(`/hospital/${hospitalId}/doctors/${doctorId}/revoke`);
