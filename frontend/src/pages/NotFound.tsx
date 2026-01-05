import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NotFound = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to="/">Go back home</Link>
      </Button>
    </div>
  );
};
