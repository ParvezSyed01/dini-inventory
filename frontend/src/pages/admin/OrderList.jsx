import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const STATUS_COLOURS = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-300',
  'In Cutting': 'bg-blue-100 text-blue-800 border-blue-300',
  'Stitching': 'bg-purple-100 text-purple-800 border-purple-300',
  'Ready': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Delivered': 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Failed to update order status');
    } else {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const custName = order.customers?.name?.toLowerCase() || '';
    const custPhone = order.customers?.phone || '';
    const query = search.toLowerCase();
    return custName.includes(query) || custPhone.includes(query) || order.sub_category?.toLowerCase().includes(query);
  });

  // Business Analytics Metrics
  const totalRevenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);
  const totalPendingBalance = orders.reduce(
    (acc, curr) => acc + Math.max(0, (parseFloat(curr.total_price) || 0) - (parseFloat(curr.advance_paid) || 0)),
    0
  );
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered').length;

  return (
    <div className="space-y-6">
      {/* Top Business Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Work In Progress</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{activeOrdersCount} <span className="text-sm font-normal text-gray-500">Orders</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales Volume</p>
          <p className="text-2xl font-black text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Customer Balance</p>
          <p className="text-2xl font-black text-red-600 mt-1">₹{totalPendingBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-amber-950 tracking-wide uppercase">Bespoke Orders Register</h2>
            <p className="text-xs text-gray-500 mt-0.5">Track production progress, payments, and body measurements</p>
          </div>
          <input
            type="text"
            placeholder="🔍 Search name, phone, or garment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg w-full md:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">
            Fetching studio orders...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Garment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Financials</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const balance = (order.total_price || 0) - (order.advance_paid || 0);
                    return (
                      <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{order.customers?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 font-mono">{order.customers?.phone || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">{order.sub_category}</p>
                          <span className="text-xs text-gray-500">{order.main_category}</span>
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                              STATUS_COLOURS[order.status || 'Pending']
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Cutting">In Cutting</option>
                            <option value="Stitching">Stitching</option>
                            <option value="Ready">Ready</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="p-4 text-xs space-y-0.5">
                          <div>Total: <span className="font-bold">₹{order.total_price}</span></div>
                          <div className={balance > 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>
                            {balance > 0 ? `Due: ₹${balance}` : 'Paid in Full'}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="bg-amber-900 hover:bg-amber-950 text-white text-xs px-3 py-1.5 rounded-md font-semibold tracking-wide transition-colors"
                          >
                            View Register
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Measurement Register Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6 bg-amber-950 text-white flex justify-between items-start rounded-t-2xl">
              <div>
                <span className="text-xs bg-amber-800 text-amber-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Order Register
                </span>
                <h3 className="text-2xl font-black text-amber-100 mt-1">{selectedOrder.customers?.name}</h3>
                <p className="text-xs text-amber-300 font-mono">{selectedOrder.customers?.phone}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-amber-300 hover:text-white font-bold text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Garment Details & Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs">
                <div>
                  <p className="text-gray-500 font-medium">Garment Type</p>
                  <p className="font-bold text-amber-950 text-sm mt-0.5">{selectedOrder.sub_category}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Category</p>
                  <p className="font-bold text-amber-950 text-sm mt-0.5">{selectedOrder.main_category}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Colour Spec</p>
                  <p className="font-bold text-amber-950 text-sm mt-0.5">{selectedOrder.colour || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Production Status</p>
                  <span className={`inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOURS[selectedOrder.status || 'Pending']}`}>
                    {selectedOrder.status || 'Pending'}
                  </span>
                </div>
              </div>

              {/* 20-Point Measurement Sheet */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">20-Point Tailoring Measurement Sheet</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-mono">
                  <div className="space-y-2 border-r border-gray-200 pr-4">
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>1. CHEST</span> <span className="font-bold text-gray-900">{selectedOrder.chest || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>2. L CHEST</span> <span className="font-bold text-gray-900">{selectedOrder.l_chest || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>3. LENGTH</span> <span className="font-bold text-gray-900">{selectedOrder.length || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>4. WAIST</span> <span className="font-bold text-gray-900">{selectedOrder.waist || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>5. NECK FRONT</span> <span className="font-bold text-gray-900">{selectedOrder.neck_front || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>6. NECK BACK</span> <span className="font-bold text-gray-900">{selectedOrder.neck_back || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>7. ARMHOLE</span> <span className="font-bold text-gray-900">{selectedOrder.armhole || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>8. SHOULDER</span> <span className="font-bold text-gray-900">{selectedOrder.shoulder || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>9. DART POINT</span> <span className="font-bold text-gray-900">{selectedOrder.dart_point || '-'}</span></div>
                    <div className="flex justify-between"><span>10. SLEEVE</span> <span className="font-bold text-gray-900">{selectedOrder.sleeve || '-'}</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>11. SLEEVE CIRCUM</span> <span className="font-bold text-gray-900">{selectedOrder.sleeve_circum || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>12. BICEP</span> <span className="font-bold text-gray-900">{selectedOrder.bicep || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>13. THIGHS</span> <span className="font-bold text-gray-900">{selectedOrder.thighs || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>14. B. LENGTH</span> <span className="font-bold text-gray-900">{selectedOrder.b_length || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>15. B. WAIST</span> <span className="font-bold text-gray-900">{selectedOrder.b_waist || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>16. HIPS</span> <span className="font-bold text-gray-900">{selectedOrder.hips || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>17. CROTCH</span> <span className="font-bold text-gray-900">{selectedOrder.crotch || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>18. KNEE</span> <span className="font-bold text-gray-900">{selectedOrder.knee || '-'}</span></div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1"><span>19. B. CIRCUM</span> <span className="font-bold text-gray-900">{selectedOrder.b_circum || '-'}</span></div>
                    <div className="flex justify-between"><span>20. OTHERS</span> <span className="font-bold text-gray-900">{selectedOrder.others || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Special Instructions & Financial Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                <div>
                  <p className="font-bold text-gray-700">Special Notes / Tailor Instructions:</p>
                  <p className="text-gray-600 mt-1 italic">{selectedOrder.notes || 'No special instructions recorded.'}</p>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-sm">
                  <span>Total: ₹{selectedOrder.total_price}</span>
                  <span className="text-emerald-700">Advance: ₹{selectedOrder.advance_paid || 0}</span>
                  <span className="text-red-600">
                    Remaining: ₹{(selectedOrder.total_price || 0) - (selectedOrder.advance_paid || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t rounded-b-2xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-amber-950 text-white font-bold py-2.5 rounded-xl hover:bg-black transition-colors text-xs uppercase tracking-wider"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}