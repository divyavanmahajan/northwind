import type { OrgNode } from '../../../types/employee';
import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback } from '../../ui/avatar';

interface OrgTreeProps {
    data: OrgNode[];
    onNodeClick?: (id: number) => void;
}

export function OrgTree({ data, onNodeClick }: OrgTreeProps) {
    const renderNode = (node: OrgNode, depth: number = 0) => (
        <div key={node.employee_id} className="ml-4">
            <div
                className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
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

    if (!data || data.length === 0) {
        return <div className="text-muted-foreground p-4">No organization data available.</div>;
    }

    return (
        <div className="space-y-2">
            {data.map((node) => renderNode(node, 0))}
        </div>
    );
}
