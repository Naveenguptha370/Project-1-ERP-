import React from 'react';
import ModuleStubPage from './ModuleStubPage';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <ModuleStubPage
      category="Intelligence"
      moduleName="Dashboard, Reports & Analytics"
      description="Cross-module Analytics, Inventory Valuation, and Executive Management Reporting."
      icon={BarChart3}
    />
  );
}
