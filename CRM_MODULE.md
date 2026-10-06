# SmartERP — Member 3: CRM Module Documentation

## 1. Overview

Member 3 delivers the Customer Relationship Management (CRM) module within SmartERP.

### Key Entities:
1. **Customers**: Enterprise and individual client accounts with unique tracking codes (`CUST-1001`), financial limits, contract values, and address data.
2. **Leads**: Prospective business opportunities categorized across 7 pipeline stages (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`) with lead scores (0–100) and deal values.
3. **Customer History / Interactions**: Comprehensive chronological timeline logging communication activities (`CALL`, `EMAIL`, `MEETING`, `NOTE`, `TASK`, `DEAL_UPDATE`) with outcomes and scheduled follow-ups.
4. **Lead-to-Customer Conversion**: 1-click promotion of qualified leads into active customer accounts, preserving full interaction histories.

---

## 2. Workflows & Features

- **Pipeline Monitoring**: Real-time KPI metrics displaying estimated pipeline values, win rates, and stage counts.
- **Activity Scheduler**: Upcoming follow-up reminders linked directly to customer accounts.
- **Search & Filtering**: Multi-field instant searching across names, companies, emails, and account codes.
