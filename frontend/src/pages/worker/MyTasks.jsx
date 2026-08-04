import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchWorkerTasks();
  }, []);

  const fetchWorkerTasks = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (authErr || !user) {
        console.error('User authentication error:', authErr);
        setLoading(false);
        return;
      }

      const { data: rawTasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (taskErr) throw taskErr;

      if (!rawTasks || rawTasks.length === 0) {
        setTasks([]);
        return;
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*');

      const orderMap = (ordersData || []).reduce((acc, o) => {
        acc[o.id] = o.order_number ? `#${o.order_number}` : o.customer_name || o.id;
        return acc;
      }, {});

      const mappedTasks = rawTasks.map((t) => ({
        ...t,
        order_display: orderMap[t.order_id] || 'General Work',
      }));

      setTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching worker tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkForReview = async (taskId, taskDetails = '') => {
    setUpdatingId(taskId);
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'Under Review',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      const safeDetails = typeof taskDetails === 'string' ? taskDetails : '';
      const previewText = safeDetails ? safeDetails.slice(0, 40) : 'Task details updated';

      await supabase.from('notifications').insert([
        {
          user_role: 'admin',
          title: 'Task Marked for Review',
          message: `A worker submitted a task for review: "${previewText}..."`,
          is_read: false,
        },
      ]);

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'Under Review' } : t))
      );
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-xs font-bold text-gray-500">Loading your tasks...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black uppercase text-amber-950">My Tasks</h1>
        <button
          onClick={fetchWorkerTasks}
          className="text-xs font-bold text-amber-950 uppercase hover:underline"
        >
          Refresh Tasks
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 shadow-sm">
          No tasks currently assigned to your account.
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {task.order_display}
                  </span>
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                      task.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'Under Review'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                  {task.task_details}
                </p>
                {task.meters_issued > 0 && (
                  <p className="text-xs font-bold text-amber-900 mt-2">
                    Fabric Issued: {task.meters_issued} meters
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-end">
                {task.status === 'Pending' || task.status === 'In Progress' ? (
                  <button
                    onClick={() => handleMarkForReview(task.id, task.task_details)}
                    disabled={updatingId === task.id}
                    className="bg-amber-950 hover:bg-amber-900 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {updatingId === task.id ? 'Submitting...' : 'Mark Review'}
                  </button>
                ) : task.status === 'Under Review' ? (
                  <span className="text-xs font-bold text-amber-700 italic">
                    Awaiting Physical Inspection & Admin Approval
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-700 uppercase">
                    Approved & Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}