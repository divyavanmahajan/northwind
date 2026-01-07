import type { LucideIcon } from "lucide-react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState = ({
    title,
    description,
    icon: Icon = FileQuestion,
    action,
    className,
}: EmptyStateProps) => {
    return (
        <div
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in zoom-in duration-300",
                className
            )}
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick} className="mt-6" variant="outline">
                    {action.label}
                </Button>
            )}
        </div>
    );
};
