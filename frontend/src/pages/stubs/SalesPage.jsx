import React from 'react';
import ModuleStubPage from './ModuleStubPage';
import { ShoppingCart } from 'lucide-react';

export default function SalesPage() {
  return (
    <ModuleStubPage
      category="Commerce"
      moduleName="Sales Management"
      description="Quotations, Sales Orders, Invoices, and Payment Processing. Interacts with Inventory via deduct_stock service."
      icon={ShoppingCart}
    />
  );
}
