import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeesList } from '@/components/features/employees/EmployeesList';
import { OrgTree } from '@/components/features/employees/OrgTree';
import { useOrgTree } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Users, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';

export function Employees() {
    const [view, setView] = useState<'list' | 'org'>('list');
    const { data: orgTree } = useOrgTree();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">Manage employees and view organization structure.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-1 bg-muted p-1 rounded-md">
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('list')}
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                        <Button
                            variant={view === 'org' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('org')}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Org Chart
                        </Button>
                    </div>

                    {isAdminOrManager && (
                        <Button onClick={() => navigate('/employees/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    )}
                </div>
            </div>

            {view === 'list' ? (
                <EmployeesList />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrgTree data={orgTree || []} onNodeClick={(id) => navigate(`/employees/${id}`)} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
