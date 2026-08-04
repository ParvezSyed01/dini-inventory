import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CreateEmployee() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase.rpc('get_staff_list');
            if (error) throw error;
            setEmployees(data || []);
        } catch (err) {
            console.error('Error fetching employees:', err.message);
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const cleanEmail = email.trim().toLowerCase();

            const { error } = await supabase.rpc('create_new_employee', {
                employee_email: cleanEmail,
                employee_password: password,
                employee_name: name.trim(),
            });

            if (error) throw error;

            setMessage({ type: 'success', text: `Employee account created for ${name}` });
            setName('');
            setEmail('');
            setPassword('');
            fetchEmployees();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = async (id, empName) => {
        if (!window.confirm(`Are you sure you want to delete ${empName}?`)) return;

        try {
            const { error } = await supabase.rpc('delete_employee', { user_id: id });
            if (error) throw error;

            setMessage({ type: 'success', text: `Employee ${empName} deleted.` });
            fetchEmployees();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="p-6 bg-white border rounded shadow-sm max-w-md mx-auto">
                <h1 className="text-xl font-bold uppercase mb-4">Create Employee Account</h1>

                {message && (
                    <div
                        className={`p-3 text-xs font-bold rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleCreateEmployee} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Employee Name *</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 rounded w-full text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Employee Email *</label>
                        <input
                            type="email"
                            placeholder="worker@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border p-2 rounded w-full text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Password *</label>
                        <input
                            type="password"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border p-2 rounded w-full text-sm"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-900 text-white text-xs font-bold py-2.5 rounded uppercase tracking-wider hover:bg-amber-800 disabled:bg-gray-400"
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
            </div>

            <div className="p-6 bg-white border rounded shadow-sm">
                <h2 className="text-lg font-bold uppercase mb-4">Existing Employees</h2>

                {employees.length === 0 ? (
                    <p className="text-sm text-gray-500">No employees found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50 text-xs font-bold uppercase text-gray-600">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="border-b hover:bg-gray-50 text-sm">
                                        <td className="p-3 font-semibold text-gray-800">{emp.full_name}</td>
                                        <td className="p-3 text-gray-600">{emp.email}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                                                className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-red-700 uppercase"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}