import { cn } from "@/lib/utils";

function InputGroupAddon({
  className,
  children,
  ...props
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center px-2 rounded-lg border border-input bg-muted/50 text-muted-foreground transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InputGroupAddon };
