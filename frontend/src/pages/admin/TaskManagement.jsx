import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TaskManagement() {
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [taskList, setTaskList] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // UI State
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [expandedWorkers, setExpandedWorkers] = useState({});
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');

    // Form State
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedOrder, setSelectedOrder] = useState('');
    const [taskDetails, setTaskDetails] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetchingTasks, setFetchingTasks] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInitialData();
        fetchAllTasks();
        fetchNotifications();
    }, []);

    // 1. Fetch worker list for dropdowns using RPC
    const fetchInitialData = async () => {
        try {
            const { data: profiles, error: empErr } = await supabase.rpc('get_staff_list');

            if (!empErr && profiles) {
                const workers = profiles.filter(
                    (p) => !p.role || p.role.trim().toLowerCase() !== 'admin'
                );
                setEmployees(workers);
            }

            const { data: ordData } = await supabase.from('orders').select('*');
            setOrders(ordData || []);
        } catch (err) {
            console.error('Fetch exception:', err);
        }
    };

    // 2. Fetch tasks and map worker names using RPC
    const fetchAllTasks = async () => {
        setFetchingTasks(true);
        try {
            const { data: rawTasks, error: taskErr } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (taskErr) throw taskErr;
            if (!rawTasks || rawTasks.length === 0) {
                setTaskList([]);
                return;
            }

            // 1. FILTER OUT FABRIC ISSUANCE LOGS HERE
            const pureTasks = rawTasks.filter(
                (t) => !t.task_details || !t.task_details.toLowerCase().startsWith('issued ')
            );

            const { data: staffList } = await supabase.rpc('get_staff_list');

            const profileMap = (staffList || []).reduce((acc, p) => {
                acc[p.id] = (p.full_name && p.full_name.trim() !== '') ? p.full_name : p.email;
                return acc;
            }, {});

            const { data: ordersData } = await supabase.from('orders').select('*');
            const orderMap = (ordersData || []).reduce((acc, o) => {
                acc[o.id] = o.order_number ? `#${o.order_number}` : o.customer_name || o.id;
                return acc;
            }, {});

            const mapped = pureTasks.map((t) => ({
                ...t,
                worker_name: profileMap[t.assigned_to] || 'Unknown Worker',
                order_display: orderMap[t.order_id] || 'General Task',
                formatted_date: new Date(t.updated_at || t.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }),
                month_key: new Date(t.updated_at || t.created_at).toISOString().slice(0, 7),
            }));

            setTaskList(mapped);
        } catch (err) {
            console.error('Error fetching tasks:', err.message);
        } finally {
            setFetchingTasks(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: false });

            setNotifications(data || []);
        } catch (err) {
            console.error('Notification fetch error:', err);
        }
    };

    const markNotificationRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!selectedEmployee) {
            setMessage({ type: 'error', text: 'Please select a worker.' });
            return;
        }

        if (!taskDetails.trim()) {
            setMessage({ type: 'error', text: 'Please enter task details.' });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                assigned_to: selectedEmployee,
                order_id: selectedOrder || null,
                task_details: taskDetails.trim(),
                status: 'Pending',
            };

            const { error } = await supabase.from('tasks').insert([payload]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Task assigned successfully!' });
            setTaskDetails('');
            setSelectedOrder('');
            setSelectedEmployee('');
            setShowAssignForm(false);
            fetchAllTasks();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.message || 'Failed to assign task.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTask = async (taskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'Completed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', taskId);

            if (error) throw error;

            setTaskList((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status: 'Completed', updated_at: new Date().toISOString() } : t))
            );
        } catch (err) {
            alert('Failed to approve task: ' + err.message);
        }
    };

    const toggleWorkerAccordion = (workerId) => {
        setExpandedWorkers((prev) => ({
            ...prev,
            [workerId]: !prev[workerId],
        }));
    };

    const tasksByWorker = employees.map((emp) => {
        const workerTasks = taskList.filter((t) => {
            const matchesWorker = t.assigned_to === emp.id;
            const matchesMonth = selectedMonthFilter === 'all' || t.month_key === selectedMonthFilter;
            return matchesWorker && matchesMonth;
        });

        const displayName = (emp.full_name && emp.full_name.trim() !== '')
            ? emp.full_name
            : emp.email || 'Unnamed Worker';

        return {
            workerId: emp.id,
            fullName: displayName,
            tasks: workerTasks,
            totalCount: workerTasks.length,
            activeCount: workerTasks.filter((t) => t.status !== 'Completed').length,
            completedCount: workerTasks.filter((t) => t.status === 'Completed').length,
        };
    });

    const availableMonths = Array.from(new Set(taskList.map((t) => t.month_key))).filter(Boolean);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* IN-APP NOTIFICATIONS */}
            {notifications.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                            Admin Notifications ({notifications.length})
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className="bg-white p-2.5 rounded-lg border border-amber-200 flex justify-between items-center text-xs"
                            >
                                <div>
                                    <span className="font-bold text-gray-900">{n.title}: </span>
                                    <span className="text-gray-600">{n.message}</span>
                                </div>
                                <button
                                    onClick={() => markNotificationRead(n.id)}
                                    className="text-[10px] font-bold text-amber-900 hover:underline uppercase ml-4"
                                >
                                    Dismiss
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOP HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-black uppercase text-amber-950">Task Operations</h1>
                    <p className="text-xs text-gray-500 font-medium">Manage worker assignments and audits</p>
                </div>
                <button
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="bg-amber-950 hover:bg-amber-900 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition-colors"
                >
                    {showAssignForm ? '✕ Close Form' : '+ Assign New Task'}
                </button>
            </div>

            {/* COLLAPSIBLE ASSIGN TASK FORM */}
            {showAssignForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all">
                    <h2 className="text-lg font-black uppercase text-amber-950 mb-4">
                        Assign New Task
                    </h2>

                    {message.text && (
                        <div
                            className={`p-3 rounded-lg text-xs font-bold mb-4 ${message.type === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleAssignTask} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">
                                Select Worker *
                            </label>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white"
                                required
                            >
                                <option value="">-- Choose Worker --</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {(emp.full_name && emp.full_name.trim() !== '') ? emp.full_name : emp.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">
                                Select Order (Optional)
                            </label>
                            <select
                                value={selectedOrder}
                                onChange={(e) => setSelectedOrder(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white"
                            >
                                <option value="">-- No Order Linked --</option>
                                {orders.map((ord) => (
                                    <option key={ord.id} value={ord.id}>
                                        {ord.order_number ? `#${ord.order_number} - ` : ''}
                                        {ord.customer_name || ord.client_name || `Order ${ord.id.slice(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">
                                Task Details *
                            </label>
                            <textarea
                                value={taskDetails}
                                onChange={(e) => setTaskDetails(e.target.value)}
                                placeholder="Describe the work to be done..."
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm h-24 bg-gray-50 focus:bg-white"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAssignForm(false)}
                                className="px-4 py-2.5 text-xs font-bold uppercase text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-amber-950 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider hover:bg-amber-900 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Assigning Task...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* WORKER-GROUPED TASK HISTORY */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h2 className="text-lg font-black uppercase text-amber-950">
                            Worker Work History
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Click a worker to view or approve their assigned tasks.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold uppercase text-gray-500">Filter Month:</label>
                        <select
                            value={selectedMonthFilter}
                            onChange={(e) => setSelectedMonthFilter(e.target.value)}
                            className="border border-gray-300 p-2 rounded-lg text-xs font-bold bg-gray-50"
                        >
                            <option value="all">All Time</option>
                            {availableMonths.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {fetchingTasks ? (
                    <div className="text-xs font-bold text-gray-500 py-4">Loading workers...</div>
                ) : tasksByWorker.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4">No registered workers found.</div>
                ) : (
                    <div className="space-y-4">
                        {tasksByWorker.map((group) => {
                            const isExpanded = !!expandedWorkers[group.workerId];

                            return (
                                <div
                                    key={group.workerId}
                                    className="border border-gray-200 rounded-xl overflow-hidden transition-all shadow-sm"
                                >
                                    <button
                                        onClick={() => toggleWorkerAccordion(group.workerId)}
                                        className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex items-center justify-between text-left transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900 text-sm">
                                                {group.fullName}
                                            </span>
                                            <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2.5 py-0.5 rounded-full">
                                                {group.totalCount} {group.totalCount === 1 ? 'Task' : 'Tasks'} Total
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-xs flex gap-2 font-bold">
                                                {group.activeCount > 0 && (
                                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                                        {group.activeCount} Active
                                                    </span>
                                                )}
                                                <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                                                    {group.completedCount} Verified
                                                </span>
                                            </div>
                                            <span className="text-xs font-black text-gray-400">
                                                {isExpanded ? '▲ Hide' : '▼ View History'}
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 bg-white border-t border-gray-200">
                                            {group.tasks.length === 0 ? (
                                                <div className="text-xs font-medium text-gray-400 py-2">
                                                    No tasks recorded for this period.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 text-xs font-bold uppercase text-gray-400">
                                                                <th className="py-2.5 px-2">Worker Name</th>
                                                                <th className="py-2.5 px-2">Order</th>
                                                                <th className="py-2.5 px-2">Task Details</th>
                                                                <th className="py-2.5 px-2">Status</th>
                                                                <th className="py-2.5 px-2 text-right">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 text-xs">
                                                            {group.tasks.map((task) => (
                                                                <tr key={task.id} className="hover:bg-gray-50">
                                                                    <td className="py-3 px-2 font-bold text-gray-900">
                                                                        {task.worker_name}
                                                                    </td>
                                                                    <td className="py-3 px-2 font-semibold text-gray-600">
                                                                        {task.order_display}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-gray-800 font-medium max-w-sm">
                                                                        {task.task_details}
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        <span
                                                                            className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] ${task.status === 'Completed'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : task.status === 'Under Review'
                                                                                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                                                                                        : 'bg-blue-100 text-blue-800'
                                                                                }`}
                                                                        >
                                                                            {task.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right space-x-2">
                                                                        {task.status === 'Under Review' ? (
                                                                            <button
                                                                                onClick={() => handleApproveTask(task.id)}
                                                                                className="bg-green-700 hover:bg-green-800 text-white font-bold px-2.5 py-1 rounded transition-colors text-[10px] uppercase"
                                                                            >
                                                                                Approve & Complete
                                                                            </button>
                                                                        ) : task.status === 'Completed' ? (
                                                                            <span className="font-bold text-gray-400 uppercase text-[10px]">
                                                                                Verified
                                                                            </span>
                                                                        ) : (
                                                                            <span className="font-bold text-blue-800 italic text-[10px]">
                                                                                {task.status}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}