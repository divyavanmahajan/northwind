import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee, useEmployeeMutations } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/features/employees/EmployeeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/common/Skeletons';

export function EmployeeFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();

    // Pass 0 or invalid ID if not editing, hook handles enabled check
    const { data: employee, isLoading: isLoadingEmployee } = useEmployee(isEditing ? parseInt(id!) : 0);
    const { createEmployee, updateEmployee } = useEmployeeMutations();

    const handleSubmit = async (data: any) => {
        const promise = isEditing
            ? updateEmployee.mutateAsync({ id: parseInt(id!), data })
            : createEmployee.mutateAsync(data);

        toast.promise(promise, {
            loading: isEditing ? 'Updating employee...' : 'Creating employee...',
            success: (res) => {
                navigate('/employees');
                return `Employee "${res.first_name} ${res.last_name}" ${isEditing ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${isEditing ? 'update' : 'create'} employee: ${apiError}`;
            },
        });
    };

    if (isEditing && isLoadingEmployee) return <PageLoading />;
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-bold">{isEditing ? 'Edit Employee' : 'New Employee'}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Edit details' : 'Employee details'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmployeeForm
                        initialData={employee}
                        onSubmit={handleSubmit}
                        isLoading={createEmployee.isPending || updateEmployee.isPending}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
