import { Filter } from 'lucide-react';
import { Badge } from '@sonordia/ui/badge';
import { Button } from '@sonordia/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@sonordia/ui/drawer';
import { cn } from '@sonordia/ui/utils';
import type { Song, Tag } from '../types';
import { collectTagPools } from './tagUtils';

interface TagFilterDrawerProps {
  songs: Song[];
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  selectedTagIds: Set<string>;
  onToggle: (tagId: string) => void;
  onClear: () => void;
}

export function TagFilterDrawer({
  songs,
  currentPlaylistId,
  currentPlaylistName,
  selectedTagIds,
  onToggle,
  onClear,
}: TagFilterDrawerProps) {
  const pools = collectTagPools(songs, currentPlaylistId);
  const hasAny = pools.global.length > 0 || pools.playlist.length > 0;
  const activeCount = selectedTagIds.size;

  return (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="size-4" />
          Filter
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Filter by tags</DrawerTitle>
          <DrawerDescription>
            Show songs with any of the selected tags.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hasAny ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No tags yet. Add tags to songs to filter by them.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              <TagFilterGroup
                label="Global"
                tags={pools.global}
                selectedTagIds={selectedTagIds}
                onToggle={onToggle}
              />
              {currentPlaylistId && (
                <TagFilterGroup
                  label={`Playlist: ${currentPlaylistName ?? ''}`}
                  tags={pools.playlist}
                  selectedTagIds={selectedTagIds}
                  onToggle={onToggle}
                />
              )}
            </div>
          )}
        </div>

        <DrawerFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={onClear} disabled={activeCount === 0}>
            Clear ({activeCount})
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function TagFilterGroup({
  label,
  tags,
  selectedTagIds,
  onToggle,
}: {
  label: string;
  tags: Tag[];
  selectedTagIds: Set<string>;
  onToggle: (tagId: string) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div>
      <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const selected = selectedTagIds.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className="focus-visible:outline-ring rounded-full focus-visible:outline-2"
            >
              <Badge
                variant={selected ? 'default' : tag.playlist_id ? 'outline' : 'secondary'}
                className={cn(
                  'h-6 cursor-pointer px-2.5 text-xs',
                  selected ? '' : 'hover:bg-accent',
                )}
              >
                {tag.name}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
