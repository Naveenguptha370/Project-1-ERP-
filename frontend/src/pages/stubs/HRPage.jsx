import React from 'react';
import ModuleStubPage from './ModuleStubPage';
import { Users } from 'lucide-react';

export default function HRPage() {
  return (
    <ModuleStubPage
      category="Workforce"
      moduleName="Human Resources Management"
      description="Employees, Departments, Attendance, and Leave tracking systems."
      icon={Users}
    />
  );
}
