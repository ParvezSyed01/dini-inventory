import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CreateOrder() {
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [existingCustomerId, setExistingCustomerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Order Header Details
  const [mainCategory, setMainCategory] = useState('Indian');
  const [subCategory, setSubCategory] = useState('');
  const [colour, setColour] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [notes, setNotes] = useState('');

  // Complete 20 Body Measurements
  const [measurements, setMeasurements] = useState({
    chest: '', l_chest: '', length: '', waist: '', neck_front: '',
    neck_back: '', armhole: '', shoulder: '', dart_point: '', sleeve: '',
    sleeve_circum: '', bicep: '', thighs: '', b_length: '', b_waist: '',
    hips: '', crotch: '', knee: '', b_circum: '', others: ''
  });

  // Search Customer & Auto-fill Latest Measurements
  const handleSearchCustomer = async () => {
    if (!phone) return;
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase.rpc('get_latest_customer_measurements', {
        cust_phone: phone
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const record = data[0];
        setExistingCustomerId(record.customer_id);
        setCustomerName(record.customer_name);

        // Populate previous 20 measurements if available
        setMeasurements({
          chest: record.chest ?? '',
          l_chest: record.l_chest ?? '',
          length: record.length ?? '',
          waist: record.waist ?? '',
          neck_front: record.neck_front ?? '',
          neck_back: record.neck_back ?? '',
          armhole: record.armhole ?? '',
          shoulder: record.shoulder ?? '',
          dart_point: record.dart_point ?? '',
          sleeve: record.sleeve ?? '',
          sleeve_circum: record.sleeve_circum ?? '',
          bicep: record.bicep ?? '',
          thighs: record.thighs ?? '',
          b_length: record.b_length ?? '',
          b_waist: record.b_waist ?? '',
          hips: record.hips ?? '',
          crotch: record.crotch ?? '',
          knee: record.knee ?? '',
          b_circum: record.b_circum ?? '',
          others: record.others ?? ''
        });

        setMessage({
          type: 'success',
          text: 'Existing customer found! Latest 20-point measurements auto-filled.'
        });
      } else {
        setExistingCustomerId(null);
        setMessage({
          type: 'info',
          text: 'New customer phone number. Enter name and measurements.'
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to search customer data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementChange = (e) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !phone) {
      setMessage({ type: 'error', text: 'Please enter both Customer Name and Phone Number.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let customerId = existingCustomerId;

      // Ensure customer exists in database
      if (!customerId) {
        const { data: foundCust } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', phone)
          .maybeSingle();

        if (foundCust) {
          customerId = foundCust.id;
        } else {
          const { data: newCust, error: custError } = await supabase
            .from('customers')
            .insert([{ name: customerName, phone }])
            .select()
            .single();

          if (custError) throw custError;
          customerId = newCust.id;
        }
      }

      // Format numerical measurements
      const formattedMeasurements = Object.keys(measurements).reduce((acc, key) => {
        acc[key] = measurements[key] !== '' && measurements[key] !== null ? parseFloat(measurements[key]) : null;
        return acc;
      }, {});

      // Insert Order
      const { error: orderError } = await supabase.from('orders').insert([
        {
          customer_id: customerId,
          main_category: mainCategory,
          sub_category: subCategory,
          colour,
          ...formattedMeasurements,
          total_price: parseFloat(totalPrice),
          advance_paid: advancePaid ? parseFloat(advancePaid) : 0.0,
          notes
        }
      ]);

      if (orderError) throw orderError;

      setMessage({ type: 'success', text: 'Order saved with updated measurement record!' });

      // Reset Form
      setCustomerName('');
      setPhone('');
      setExistingCustomerId(null);
      setSubCategory('');
      setColour('');
      setTotalPrice('');
      setAdvancePaid('');
      setNotes('');
      setMeasurements(
        Object.keys(measurements).reduce((acc, key) => ({ ...acc, [key]: '' }), {})
      );
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit order' });
    } finally {
      setLoading(false);
    }
  };

  const balanceDue = (parseFloat(totalPrice) || 0) - (parseFloat(advancePaid) || 0);

  const leftColumnFields = [
    { id: 1, label: 'CHEST', name: 'chest' },
    { id: 2, label: 'L CHEST', name: 'l_chest' },
    { id: 3, label: 'LENGTH', name: 'length' },
    { id: 4, label: 'WAIST', name: 'waist' },
    { id: 5, label: 'NECK FRONT', name: 'neck_front' },
    { id: 6, label: 'NECK BACK', name: 'neck_back' },
    { id: 7, label: 'ARMHOLE', name: 'armhole' },
    { id: 8, label: 'SHOULDER', name: 'shoulder' },
    { id: 9, label: 'DART POINT', name: 'dart_point' },
    { id: 10, label: 'SLEEVE', name: 'sleeve' }
  ];

  const rightColumnFields = [
    { id: 11, label: 'SLEEVE CIRCUM', name: 'sleeve_circum' },
    { id: 12, label: 'BICEP', name: 'bicep' },
    { id: 13, label: 'THIGHS', name: 'thighs' },
    { id: 14, label: 'B. LENGTH', name: 'b_length' },
    { id: 15, label: 'B. WAIST', name: 'b_waist' },
    { id: 16, label: 'HIPS', name: 'hips' },
    { id: 17, label: 'CROTCH', name: 'crotch' },
    { id: 18, label: 'KNEE', name: 'knee' },
    { id: 19, label: 'B. CIRCUM', name: 'b_circum' },
    { id: 20, label: 'OTHERS', name: 'others' }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg my-6 border">
      <div className="border-b pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold text-amber-950 uppercase tracking-wide">New Body Measurement Entry</h1>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded text-sm font-semibold ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        {/* Customer Lookup Header */}
        <div className="mb-6 p-4 bg-amber-50/60 border border-amber-200 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-900 uppercase mb-1">Customer Phone *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border p-2 rounded w-full text-sm bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={handleSearchCustomer}
                  disabled={loading}
                  className="bg-amber-900 text-white px-4 py-2 text-sm font-semibold rounded hover:bg-amber-950"
                >
                  Lookup
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border p-2 rounded w-full text-sm bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Garment Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded bg-gray-50">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
            <select
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
            >
              <option value="Indian">Indian</option>
              <option value="Western">Western</option>
              <option value="Indo-western">Indo-western</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sub-Category (Garment) *</label>
            <input
              type="text"
              placeholder="e.g. Kurti, Suit, Lehenga"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Colour</label>
            <input
              type="text"
              placeholder="e.g. Royal Blue"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
            />
          </div>
        </div>

        {/* 20 Measurement Sheet */}
        <div className="border rounded p-4 mb-6 bg-white">
          <h3 className="text-sm font-bold text-amber-950 uppercase mb-4 border-b pb-2">20 Body Measurements</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              {leftColumnFields.map((field) => (
                <div key={field.name} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold text-gray-400 text-right">{field.id}</span>
                  <label className="w-32 text-xs font-semibold text-gray-700 uppercase">{field.label}</label>
                  <input
                    type="number"
                    step="0.25"
                    name={field.name}
                    value={measurements[field.name]}
                    onChange={handleMeasurementChange}
                    className="border p-1.5 rounded w-full text-sm font-mono text-center"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {rightColumnFields.map((field) => (
                <div key={field.name} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold text-gray-400 text-right">{field.id}</span>
                  <label className="w-36 text-xs font-semibold text-gray-700 uppercase">{field.label}</label>
                  <input
                    type="number"
                    step="0.25"
                    name={field.name}
                    value={measurements[field.name]}
                    onChange={handleMeasurementChange}
                    className="border p-1.5 rounded w-full text-sm font-mono text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="p-4 border rounded bg-gray-50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">TOTAL PRICE (₹) *</label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="border p-2 rounded w-full bg-white text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">ADVANCE PAID (₹)</label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="border p-2 rounded w-full bg-white text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">BALANCE REMAINING (₹)</label>
              <input
                type="number"
                value={balanceDue >= 0 ? balanceDue : 0}
                disabled
                className="border p-2 rounded w-full bg-gray-200 text-sm font-extrabold text-amber-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">SPECIAL INSTRUCTIONS / NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border p-2 rounded w-full bg-white text-sm"
              rows="3"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-900 text-white font-bold py-3 rounded hover:bg-amber-950 disabled:bg-gray-400 text-sm uppercase"
        >
          {loading ? 'Processing...' : 'Save Order Record'}
        </button>
      </form>
    </div>
  );
}