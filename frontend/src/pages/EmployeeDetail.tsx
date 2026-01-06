import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';

function StatCard({ title, value }: { title: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{title}</p>
            </CardContent>
        </Card>
    );
}

export function EmployeeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: employee, isLoading, isError } = useEmployee(parseInt(id!));
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    if (isLoading) return <div>Loading...</div>;
    if (isError || !employee) return <div>Employee not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/employees')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h1>
                        <p className="text-muted-foreground">{employee.title}</p>
                    </div>
                </div>
                {isAdminOrManager && (
                    <Button onClick={() => navigate(`/employees/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Orders" value={employee.statistics?.total_orders || 0} />
                <StatCard title="This Month" value={employee.statistics?.orders_this_month || 0} />
                <StatCard title="Total Sales" value={formatCurrency(employee.statistics?.total_sales || 0)} />
                <StatCard title="Avg Order" value={formatCurrency(employee.statistics?.average_order_value || 0)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manager info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reports To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employee.manager ? (
                            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded"
                                onClick={() => navigate(`/employees/${employee.manager!.employee_id}`)}>
                                <Avatar>
                                    <AvatarFallback>
                                        {employee.manager.full_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{employee.manager.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{employee.manager.title}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Top level management (No manager)</p>
                        )}
                    </CardContent>
                </Card>

                {/* Subordinates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Direct Reports ({employee.subordinates?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {employee.subordinates && employee.subordinates.length > 0 ? (
                            employee.subordinates.map((sub) => (
                                <div key={sub.employee_id}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded"
                                    onClick={() => navigate(`/employees/${sub.employee_id}`)}>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {sub.full_name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{sub.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{sub.title}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground">No direct reports</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact</p>
                        <p>{employee.home_phone} {employee.extension && `ext. ${employee.extension}`}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                        <p>{employee.address}</p>
                        <p>{employee.city}, {employee.region} {employee.postal_code}</p>
                        <p>{employee.country}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Dates</p>
                        <p>Hired: {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}</p>
                        <p>Born: {employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-sm">{employee.notes}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
