import React from 'react';
import ModuleStubPage from './ModuleStubPage';
import { UserCheck } from 'lucide-react';

export default function CRMPage() {
  return (
    <ModuleStubPage
      category="Customer"
      moduleName="Customer Relationship Management (CRM)"
      description="Customers, Leads, Pipeline, and Customer History tracking."
      icon={UserCheck}
    />
  );
}
