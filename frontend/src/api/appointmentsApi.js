import axiosClient from './axiosClient';

export const createAppointment = (data) => axiosClient.post('/appointments', data);
export const listHospitalAppointments = (hospitalId, params) =>
  axiosClient.get(`/hospital/${hospitalId}/appointments`, { params });
export const listDoctorAppointments = (doctorId) =>
  axiosClient.get(`/doctors/${doctorId}/appointments`);
export const getMyAppointments = () => axiosClient.get('/me/appointments');
export const updateAppointmentStatus = (id, status) =>
  axiosClient.patch(`/appointments/${id}/status`, { status });
export const rescheduleAppointment = (id, data) =>
  axiosClient.patch(`/appointments/${id}/reschedule`, data);
