# Prompt 20: Employees UI Components

## Context
Build Employees UI with org chart visualization and hierarchy display.

## Prerequisites
- Completed Prompt 19 (Employees CRUD Backend)

## Goals
1. Create employee list with manager info
2. Build simple org chart display
3. Implement employee detail with subordinates
4. Add manager selection in form

---

## Prompt

```text
Implement Employees UI with hierarchy visualization.

ORG TREE COMPONENT (src/components/features/employees/OrgTree.tsx):
Simple recursive tree display:

```typescript
interface OrgNode {
  employee_id: number;
  name: string;
  title: string | null;
  subordinates: OrgNode[];
}

interface OrgTreeProps {
  data: OrgNode[];
  onNodeClick?: (id: number) => void;
}

export function OrgTree({ data, onNodeClick }: OrgTreeProps) {
  const renderNode = (node: OrgNode, depth: number = 0) => (
    <div key={node.employee_id} className="ml-4">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted",
          depth === 0 && "ml-0"
        )}
        onClick={() => onNodeClick?.(node.employee_id)}
      >
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {node.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="font-medium text-sm">{node.name}</p>
          {node.title && (
            <p className="text-xs text-muted-foreground">{node.title}</p>
          )}
        </div>
      </div>
      {node.subordinates.length > 0 && (
        <div className="border-l-2 border-muted ml-4">
          {node.subordinates.map((sub) => renderNode(sub, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {data.map((node) => renderNode(node, 0))}
    </div>
  );
}
```

EMPLOYEES PAGE WITH ORG CHART TAB:
```typescript
export function Employees() {
  const [view, setView] = useState<'list' | 'org'>('list');
  const { data: orgTree } = useOrgTree();
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={view === 'org' ? 'default' : 'outline'}
            onClick={() => setView('org')}
          >
            <Users className="h-4 w-4 mr-2" />
            Org Chart
          </Button>
        </div>
      </div>
      
      {view === 'list' ? (
        // Standard DataTable
        <EmployeesList />
      ) : (
        // Org tree view
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
```

EMPLOYEE DETAIL WITH SUBORDINATES:
```typescript
export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: employee } = useEmployee(parseInt(id!));
  
  return (
    <div className="p-6 space-y-6">
      {/* Header with name and title */}
      
      {/* Statistics cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={employee.statistics.total_orders} />
        <StatCard title="This Month" value={employee.statistics.orders_this_month} />
        <StatCard title="Total Sales" value={formatCurrency(employee.statistics.total_sales)} />
        <StatCard title="Avg Order" value={formatCurrency(employee.statistics.average_order_value)} />
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Manager info */}
        {employee.manager && (
          <Card>
            <CardHeader>
              <CardTitle>Reports To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded"
                   onClick={() => navigate(`/employees/${employee.manager.employee_id}`)}>
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
            </CardContent>
          </Card>
        )}
        
        {/* Subordinates */}
        {employee.subordinates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Direct Reports ({employee.subordinates.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {employee.subordinates.map((sub) => (
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
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Employee information tabs */}
    </div>
  );
}
```

EMPLOYEE FORM WITH MANAGER SELECT:
```typescript
// Fetch available managers for dropdown
const { data: managers } = useAvailableManagers(employee?.employee_id);

<div className="space-y-2">
  <Label>Reports To</Label>
  <Select value={reportsTo} onValueChange={setReportsTo}>
    <SelectTrigger>
      <SelectValue placeholder="No manager" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">No manager (Top level)</SelectItem>
      {managers?.map((mgr) => (
        <SelectItem key={mgr.employee_id} value={mgr.employee_id.toString()}>
          {mgr.full_name} - {mgr.title}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

VERIFICATION:
1. View employee list
2. Switch to org chart view
3. Click on nodes to navigate
4. View employee detail with manager/subordinates
5. Edit employee with manager selection

SUCCESS CRITERIA:
- List and org chart views toggle
- Org tree displays hierarchy correctly
- Detail shows manager and subordinates
- Manager selection works in form
```

---

## Next Step
Proceed to [Prompt 21: Orders & Order Details CRUD (Backend)](./21-orders-crud.md)
