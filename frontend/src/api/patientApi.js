import axiosClient from './axiosClient';

export const listPatients = (hospitalId, search) =>
  axiosClient.get('/patients', { params: { hospital_id: hospitalId, search } });
export const getPatient = (id) => axiosClient.get(`/patients/${id}`);
