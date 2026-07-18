import axiosClient from './axiosClient';

export const getMyHospital = () => axiosClient.get('/hospitals/me');
export const getHospital = (id) => axiosClient.get(`/hospitals/${id}`);
export const getDashboard = (id) => axiosClient.get(`/hospitals/${id}/dashboard`);
