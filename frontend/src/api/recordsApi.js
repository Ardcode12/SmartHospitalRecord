import axiosClient from './axiosClient';

export const uploadRecord = (patientId, formData) =>
  axiosClient.post(`/patients/${patientId}/records`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const listPatientRecords = (patientId) =>
  axiosClient.get(`/patients/${patientId}/records`);
export const getRecord = (id) => axiosClient.get(`/records/${id}`);
export const deleteRecord = (id) => axiosClient.delete(`/records/${id}`);
export const getMyRecords = () => axiosClient.get('/me/records');
