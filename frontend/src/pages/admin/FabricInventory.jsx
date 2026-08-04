import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CATEGORY_MAP = {
  Indian: ['Sarees', 'Blouses', 'Anarkali', 'Gowns', 'Kaftaan'],
  Western: ['Jumpsuit', 'Dresses', 'Tunics', 'Jackets', 'Quadsets'],
  'Indo-western': [],
};

export default function FabricInventory() {
  const [fabrics, setFabrics] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignedHistory, setAssignedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [issueMessage, setIssueMessage] = useState({ type: '', text: '' });

  // Add Fabric Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [colour, setColour] = useState('');
  const [availableMeters, setAvailableMeters] = useState('');
  const [costPerMeter, setCostPerMeter] = useState('');

  // Issue Fabric Form State
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [metersToIssue, setMetersToIssue] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchFabrics(), fetchWorkers(), fetchAssignedHistory()]);
    setLoading(false);
  };

  const fetchFabrics = async () => {
    const { data, error } = await supabase
      .from('fabrics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setFabrics(data || []);
    }
  };

  // Uses RPC 'get_staff_list' to guarantee access to full names
  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_staff_list');
      if (error) throw error;

      if (data) {
        const activeWorkers = data.filter(
          (p) => !p.role || p.role.trim().toLowerCase() !== 'admin'
        );
        setWorkers(activeWorkers);
      }
    } catch (err) {
      console.error('Error fetching workers via RPC:', err.message);
    }
  };

  // Uses RPC 'get_staff_list' to match worker IDs with names in logs
  const fetchAssignedHistory = async () => {
    try {
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .gt('meters_issued', 0)
        .order('created_at', { ascending: false });

      if (taskErr) throw taskErr;
      if (!taskData || taskData.length === 0) {
        setAssignedHistory([]);
        return;
      }

      // Fetch workers using the working RPC function and fabrics via select
      const [{ data: staffList, error: staffErr }, { data: fabricList }] = await Promise.all([
        supabase.rpc('get_staff_list'),
        supabase.from('fabrics').select('id, code, name, type, colour'),
      ]);

      if (staffErr) console.error('Staff fetch error:', staffErr.message);

      const workerMap = (staffList || []).reduce((acc, p) => {
        // Prioritize full_name, fallback to email only if missing
        acc[p.id] = p.full_name && p.full_name.trim() !== '' ? p.full_name : p.email;
        return acc;
      }, {});

      const fabricMap = (fabricList || []).reduce((acc, f) => {
        acc[f.id] = f;
        return acc;
      }, {});

      const mapped = taskData.map((t) => {
        const fabricInfo = fabricMap[t.fabric_id] || {};
        return {
          id: t.id,
          worker_name: workerMap[t.assigned_to] || 'Unknown Worker',
          fabric_code: fabricInfo.code || 'N/A',
          fabric_name: fabricInfo.name || 'Unspecified',
          category: fabricInfo.type || 'N/A',
          subcategory: fabricInfo.colour || 'N/A',
          meters_issued: t.meters_issued,
          assigned_at: new Date(t.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      });

      setAssignedHistory(mapped);
    } catch (err) {
      console.error('Error fetching assigned history:', err.message);
    }
  };

  const handleAddFabric = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.from('fabrics').insert([
      {
        code,
        name,
        type,
        colour,
        available_meters: parseFloat(availableMeters),
        cost_per_meter: parseFloat(costPerMeter),
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Fabric added successfully!' });
      setCode('');
      setName('');
      setType('');
      setColour('');
      setAvailableMeters('');
      setCostPerMeter('');
      fetchFabrics();
    }
    setLoading(false);
  };

  const availableSubcategories = selectedType ? CATEGORY_MAP[selectedType] || [] : [];

  const availableFabrics = fabrics.filter((f) => {
    const matchCategory = f.type === selectedType;
    if (selectedType === 'Indo-western') return matchCategory && f.available_meters > 0;
    return matchCategory && f.colour === selectedColour && f.available_meters > 0;
  });

  const handleIssueFabric = async (e) => {
    e.preventDefault();
    setIssueMessage({ type: '', text: '' });

    const meters = parseFloat(metersToIssue);

    if (!selectedWorker) {
      setIssueMessage({ type: 'error', text: 'Please select a worker.' });
      return;
    }

    if (!selectedFabric || !meters || meters <= 0) {
      setIssueMessage({ type: 'error', text: 'Select a fabric item and valid meters.' });
      return;
    }

    if (meters > selectedFabric.available_meters) {
      setIssueMessage({
        type: 'error',
        text: `Insufficient stock! Only ${selectedFabric.available_meters}m available.`,
      });
      return;
    }

    setIssuing(true);

    try {
      const { error } = await supabase.rpc('issue_fabric_to_worker', {
        p_worker_id: selectedWorker,
        p_fabric_id: selectedFabric.id,
        p_meters: meters,
      });

      if (error) throw error;

      setIssueMessage({
        type: 'success',
        text: `Successfully assigned ${meters}m of ${selectedFabric.name} to worker.`,
      });

      setSelectedWorker('');
      setSelectedType('');
      setSelectedColour('');
      setSelectedFabric(null);
      setMetersToIssue('');

      fetchFabrics();
      fetchAssignedHistory();
    } catch (err) {
      setIssueMessage({ type: 'error', text: err.message || 'Failed to issue fabric.' });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8 border space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Fabric Stock & Allocation Management</h2>

      {/* 1. ISSUE FABRIC FORM */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
        <div>
          <h3 className="text-lg font-bold text-amber-900 uppercase">Issue Fabric To Worker</h3>
          <p className="text-xs text-amber-700">Assign stock to workers based on category and subcategory.</p>
        </div>

        {issueMessage.text && (
          <div
            className={`p-3 rounded text-sm font-semibold ${
              issueMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {issueMessage.text}
          </div>
        )}

        <form onSubmit={handleIssueFabric} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold uppercase">
          {/* Worker Dropdown */}
          <div>
            <label className="block mb-1 text-gray-700">Select Worker *</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm normal-case"
              required
            >
              <option value="">-- Select Worker --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name || w.email}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block mb-1 text-gray-700">Category *</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedColour('');
                setSelectedFabric(null);
              }}
              className="border p-2 rounded w-full bg-white text-sm normal-case"
              required
            >
              <option value="">-- Select Category --</option>
              {Object.keys(CATEGORY_MAP).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="block mb-1 text-gray-700">Subcategory</label>
            <select
              value={selectedColour}
              onChange={(e) => {
                setSelectedColour(e.target.value);
                setSelectedFabric(null);
              }}
              disabled={!selectedType || availableSubcategories.length === 0}
              className="border p-2 rounded w-full bg-white text-sm normal-case disabled:opacity-50"
              required={availableSubcategories.length > 0}
            >
              <option value="">
                {availableSubcategories.length === 0 ? 'N/A (No Subcategory)' : '-- Select Subcategory --'}
              </option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Select Fabric Item */}
          <div className="md:col-span-2">
            <label className="block mb-1 text-gray-700">Select Fabric Item *</label>
            <select
              onChange={(e) => {
                const found = availableFabrics.find((f) => f.id === e.target.value);
                setSelectedFabric(found || null);
              }}
              disabled={!selectedType || (availableSubcategories.length > 0 && !selectedColour)}
              className="border p-2 rounded w-full bg-white text-sm normal-case disabled:opacity-50"
              required
            >
              <option value="">-- Select Fabric Stock Item --</option>
              {availableFabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  [{f.code}] {f.name} (Available: {f.available_meters}m)
                </option>
              ))}
            </select>
          </div>

          {/* Meters to Issue */}
          <div>
            <label className="block mb-1 text-gray-700">Meters To Issue *</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.00"
              value={metersToIssue}
              onChange={(e) => setMetersToIssue(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm normal-case"
              required
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={issuing}
              className="w-full bg-amber-900 text-white font-bold py-2.5 rounded hover:bg-amber-950 text-xs uppercase disabled:opacity-50"
            >
              {issuing ? 'Assigning...' : 'Confirm Fabric Assignment'}
            </button>
          </div>
        </form>
      </div>

      <hr />

      {/* 2. ASSIGNED FABRIC LOG TABLE */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase">
          Assigned Fabric Log
        </h3>
        <div className="overflow-x-auto border rounded shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-950 text-white text-xs uppercase">
              <tr>
                <th className="p-3">Worker Name</th>
                <th className="p-3">Fabric Code</th>
                <th className="p-3">Fabric Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Subcategory</th>
                <th className="p-3">Issued Meters</th>
                <th className="p-3">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignedHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    No fabric assignments logged yet.
                  </td>
                </tr>
              ) : (
                assignedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-900">{item.worker_name}</td>
                    <td className="p-3 font-bold text-amber-900">{item.fabric_code}</td>
                    <td className="p-3 text-gray-800">{item.fabric_name}</td>
                    <td className="p-3 font-medium text-gray-600">{item.category}</td>
                    <td className="p-3 font-medium text-gray-600">{item.subcategory || 'N/A'}</td>
                    <td className="p-3 font-black text-amber-950">{item.meters_issued} m</td>
                    <td className="p-3 text-xs text-gray-500">{item.assigned_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <hr />

      {/* 3. ADD NEW FABRIC STOCK FORM */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase">Add New Fabric Stock</h3>

        {message.text && (
          <div
            className={`p-4 mb-6 rounded text-sm font-semibold ${
              message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAddFabric} className="p-4 bg-gray-50 border rounded grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fabric Code</label>
            <input
              type="text"
              placeholder="e.g. FAB-101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fabric Name</label>
            <input
              type="text"
              placeholder="e.g. Silk Fabric"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setColour('');
              }}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            >
              <option value="">-- Select Category --</option>
              {Object.keys(CATEGORY_MAP).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subcategory</label>
            <select
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              disabled={!type || (CATEGORY_MAP[type] && CATEGORY_MAP[type].length === 0)}
              className="border p-2 rounded w-full bg-white text-sm disabled:opacity-50"
            >
              <option value="">
                {type && CATEGORY_MAP[type]?.length === 0 ? 'N/A' : '-- Select Subcategory --'}
              </option>
              {(CATEGORY_MAP[type] || []).map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock (Meters)</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.00"
              value={availableMeters}
              onChange={(e) => setAvailableMeters(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cost / Meter (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={costPerMeter}
              onChange={(e) => setCostPerMeter(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-800 text-white font-bold py-2 rounded hover:bg-amber-900 text-sm uppercase disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Fabric to Stock'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. INVENTORY TABLE */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase">Current Fabric Inventory</h3>
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-800 text-white text-xs uppercase">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Subcategory</th>
                <th className="p-3">Stock (Meters)</th>
                <th className="p-3">Cost / Meter</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fabrics.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No fabric inventory recorded yet.
                  </td>
                </tr>
              ) : (
                fabrics.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold">{item.code}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.type || '-'}</td>
                    <td className="p-3">{item.colour || 'N/A'}</td>
                    <td
                      className={`p-3 font-bold ${
                        item.available_meters < 5 ? 'text-red-600' : 'text-green-700'
                      }`}
                    >
                      {item.available_meters} m
                    </td>
                    <td className="p-3">₹{item.cost_per_meter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}