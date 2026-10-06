import React from 'react';
import ModuleStubPage from './ModuleStubPage';
import { Briefcase } from 'lucide-react';

export default function PurchasesPage() {
  return (
    <ModuleStubPage
      category="Procurement"
      moduleName="Procurement & Finance"
      description="Suppliers, Purchase Orders, Purchase Invoices, and Expenses. Interacts with Inventory via add_stock service."
      icon={Briefcase}
    />
  );
}
