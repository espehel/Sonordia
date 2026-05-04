import { Button } from '@sonordia/ui/button';

interface ImportButtonProps {
  onImport: () => void;
}

export function ImportButton({ onImport }: ImportButtonProps) {
  return (
    <Button onClick={onImport} size="sm">
      Import Files
    </Button>
  );
}
