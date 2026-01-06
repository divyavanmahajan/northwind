import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee, useEmployeeMutations } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/features/employees/EmployeeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeeFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();

    // Pass 0 or invalid ID if not editing, hook handles enabled check
    const { data: employee, isLoading: isLoadingEmployee } = useEmployee(isEditing ? parseInt(id!) : 0);
    const { createEmployee, updateEmployee } = useEmployeeMutations();

    const handleSubmit = async (data: any) => {
        try {
            if (isEditing) {
                await updateEmployee.mutateAsync({ id: parseInt(id!), data });
                toast.success('Employee updated successfully');
            } else {
                await createEmployee.mutateAsync(data);
                toast.success('Employee created successfully');
            }
            navigate('/employees');
        } catch (error) {
            toast.error('Failed to save employee');
        }
    };

    if (isEditing && isLoadingEmployee) return <div>Loading...</div>;

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
