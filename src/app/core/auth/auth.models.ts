export interface EmployeeUser {
  id: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  hourlyRate: number;
  standardDailyHours: number;
  annualLeaveDays: number;
  status: string;
  role: 'EMPLOYEE';
  kind: 'employee';
}

export interface AuthResponse {
  accessToken: string;
  user: EmployeeUser;
}
