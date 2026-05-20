import { useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@sonordia/ui/alert-dialog';
import { Button } from '@sonordia/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sonordia/ui/dropdown-menu';
import { Input } from '@sonordia/ui/input';
import { LogoMark } from '@sonordia/ui/logo-mark';
import { cn } from '@sonordia/ui/utils';
import type { Playlist } from '../types';

interface SidebarProps {
  playlists: Playlist[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  playlists,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: SidebarProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
  };

  const startRename = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setEditName(playlist.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="border-border flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      <div className="mb-3 flex items-center gap-2 px-3">
        <LogoMark className="size-5" />
        <span className="text-sm font-semibold tracking-tight">Sonordia</span>
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-md px-3 py-2 text-left text-sm font-semibold',
          selectedId === null ? 'bg-muted' : 'hover:bg-muted/50',
        )}
      >
        All Songs
      </button>

      <div className="text-muted-foreground px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
        Playlists
      </div>

      {playlists.map((pl) => (
        <div
          key={pl.id}
          onClick={() => onSelect(pl.id)}
          className={cn(
            'group flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-sm',
            selectedId === pl.id ? 'bg-muted' : 'hover:bg-muted/50',
          )}
        >
          {editingId === pl.id ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="h-6 px-1 text-sm"
            />
          ) : (
            <>
              <span className="flex-1 truncate">{pl.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Playlist actions"
                    className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={() => startRename(pl)}>
                    <Pencil />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(pl)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      ))}

      <div className="mt-2 flex gap-1">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New playlist..."
          className="h-8 text-xs"
        />
        <Button
          size="icon-sm"
          onClick={handleCreate}
          disabled={!newName.trim()}
          aria-label="Create playlist"
        >
          <Plus />
        </Button>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>. The songs themselves will
              not be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
