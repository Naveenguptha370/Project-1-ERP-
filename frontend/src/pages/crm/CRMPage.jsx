import React, { useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, Users, UserRoundCheck } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { useNotification } from '../../context/NotificationContext';

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50';

export default function CRMPage() {
  const [tab, setTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityTarget, setActivityTarget] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { notifyError, notifySuccess } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRows, customerRows] = await Promise.all([
        businessService.getLeads(),
        businessService.getCustomers(),
      ]);
      setLeads(leadRows);
      setCustomers(customerRows);
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not load CRM data');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activityTarget) {
      setActivities([]);
      return;
    }
    const [type, id] = activityTarget.split(':');
    businessService.getActivities(type === 'customer' ? { customer_id: id } : { lead_id: id })
      .then(setActivities)
      .catch((error) => notifyError(error.response?.data?.detail || 'Could not load interaction history'));
  }, [activityTarget, notifyError]);

  const submitLead = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data = Object.fromEntries(form.entries());
    data.estimated_value = Number(data.estimated_value || 0);
    for (const key of ['company_name', 'email', 'phone', 'source', 'notes']) data[key] ||= null;
    try {
      await businessService.createLead(data);
      formElement.reset();
      notifySuccess('Lead created');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not create lead');
    }
  };

  const submitCustomer = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data = Object.fromEntries(form.entries());
    for (const key of ['company_name', 'email', 'phone', 'address', 'city', 'tax_id']) data[key] ||= null;
    try {
      await businessService.createCustomer(data);
      formElement.reset();
      notifySuccess('Customer created');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not create customer');
    }
  };

  const convertLead = async (id) => {
    try {
      await businessService.convertLead(id);
      notifySuccess('Lead converted to customer');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not convert lead');
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer? Existing sales records are retained.')) return;
    try {
      await businessService.deleteCustomer(id);
      notifySuccess('Customer deleted');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not delete customer');
    }
  };

  const submitActivity = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const [type, id] = activityTarget.split(':');
    data[type === 'customer' ? 'customer_id' : 'lead_id'] = Number(id);
    delete data.target;
    try {
      const activity = await businessService.createActivity(data);
      setActivities((current) => [activity, ...current]);
      form.reset();
      setActivityTarget('');
      notifySuccess('CRM interaction recorded');
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not record interaction');
    }
  };

  const filteredRows = (tab === 'leads' ? leads : customers).filter((row) =>
    [row.name, row.company_name, row.email, row.phone].some((value) =>
      String(value || '').toLowerCase().includes(query.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Customer relationships</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">CRM</h1>
        <p className="mt-1 text-sm text-slate-500">Manage customers, track leads, and convert qualified leads.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          ['leads', 'Leads', UserRoundCheck],
          ['customers', 'Customers', Users],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={tab === 'leads' ? submitLead : submitCustomer} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <h2 className="md:col-span-3 text-base font-semibold text-slate-800">
          {tab === 'leads' ? 'Add lead' : 'Add customer'}
        </h2>
        <input name="name" required minLength={2} placeholder={tab === 'leads' ? 'Contact name' : 'Customer name'} className={fieldClass} />
        <input name="company_name" placeholder="Company" className={fieldClass} />
        <input name="email" type="email" placeholder="Email" className={fieldClass} />
        <input name="phone" placeholder="Phone" className={fieldClass} />
        {tab === 'leads' ? (
          <>
            <input name="source" placeholder="Lead source" className={fieldClass} />
            <input name="estimated_value" type="number" min="0" step="0.01" placeholder="Estimated value" className={fieldClass} />
            <select name="status" defaultValue="New" className={fieldClass}>
              {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map((state) => <option key={state}>{state}</option>)}
            </select>
            <textarea name="notes" placeholder="Notes" className={`${fieldClass} md:col-span-2`} />
          </>
        ) : (
          <>
            <input name="city" placeholder="City" className={fieldClass} />
            <input name="country" defaultValue="India" placeholder="Country" className={fieldClass} />
            <input name="tax_id" placeholder="Tax ID" className={fieldClass} />
            <textarea name="address" placeholder="Address" className={fieldClass} />
          </>
        )}
        <button className={`${buttonClass} self-start`}><UserPlus size={16} /> Save {tab === 'leads' ? 'lead' : 'customer'}</button>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-800">{tab === 'leads' ? 'Lead pipeline' : 'Customer directory'}</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" className={`${fieldClass} pl-9`} />
          </div>
        </div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading CRM records…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">{tab === 'leads' ? 'Stage' : 'Phone'}</th><th className="px-4 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.company_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{tab === 'leads' ? row.status : row.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {tab === 'leads' && !row.converted_customer_id && row.status !== 'Lost' ? (
                        <button onClick={() => convertLead(row.id)} className="text-xs font-semibold text-indigo-600 hover:underline">Convert to customer</button>
                      ) : tab === 'customers' ? (
                        <button onClick={() => deleteCustomer(row.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
                {!filteredRows.length && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No records found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="grid gap-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
        <form onSubmit={submitActivity} className="space-y-3">
          <h2 className="font-semibold text-slate-800">Log interaction</h2>
          <select name="target" required value={activityTarget} onChange={(event) => setActivityTarget(event.target.value)} className={fieldClass}>
            <option value="">Select a lead or customer</option>
            <optgroup label="Leads">{leads.map((row) => <option key={`lead-${row.id}`} value={`lead:${row.id}`}>{row.name}{row.company_name ? ` — ${row.company_name}` : ''}</option>)}</optgroup>
            <optgroup label="Customers">{customers.map((row) => <option key={`customer-${row.id}`} value={`customer:${row.id}`}>{row.name}{row.company_name ? ` — ${row.company_name}` : ''}</option>)}</optgroup>
          </select>
          <select name="action" className={fieldClass}>{['Note', 'Call', 'Email', 'Meeting', 'Task'].map((action) => <option key={action}>{action}</option>)}</select>
          <textarea name="details" required minLength={1} maxLength={4000} placeholder="Interaction details" className={fieldClass} />
          <button className={buttonClass}>Save interaction</button>
        </form>
        <div>
          <h2 className="font-semibold text-slate-800">Interaction history</h2>
          {!activityTarget ? <p className="mt-3 text-sm text-slate-500">Select a lead or customer to view its history.</p> : (
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {activities.map((activity) => (
                <article key={activity.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex justify-between gap-3 text-sm font-semibold text-slate-800"><span>{activity.action}</span><time className="text-xs font-normal text-slate-500">{new Date(activity.created_at).toLocaleString()}</time></div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{activity.details || 'Record created'}</p>
                </article>
              ))}
              {!activities.length && <p className="text-sm text-slate-500">No interactions recorded.</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
