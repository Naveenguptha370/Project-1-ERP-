/**
 * SmartERP - HR API Service
 * All HR-related API calls go through this service.
 */
import api from './api'

// ── Department ───────────────────────────────────────────────────────────────
export const hrService = {
  // Departments
  getDepartments: (params = {}) => api.get('/departments', { params }),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentEmployees: (id) => api.get(`/departments/${id}/employees`),

  // Employees
  getEmployees: (params = {}) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  deactivateEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployeeAttendance: (id, params = {}) => api.get(`/employees/${id}/attendance`, { params }),
  getEmployeeLeaves: (id, params = {}) => api.get(`/employees/${id}/leaves`, { params }),
  getHRSummary: () => api.get('/employees/summary'),

  // Attendance
  getAttendance: (params = {}) => api.get('/attendance', { params }),
  getAttendanceRecord: (id) => api.get(`/attendance/${id}`),
  createAttendance: (data) => api.post('/attendance', data),
  updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
  deleteAttendance: (id) => api.delete(`/attendance/${id}`),

  // Leaves
  getLeaves: (params = {}) => api.get('/leaves', { params }),
  getLeave: (id) => api.get(`/leaves/${id}`),
  createLeave: (data) => api.post('/leaves', data),
  updateLeave: (id, data) => api.put(`/leaves/${id}`, data),
  reviewLeave: (id, data) => api.post(`/leaves/${id}/review`, data),
  cancelLeave: (id) => api.post(`/leaves/${id}/cancel`),
}
