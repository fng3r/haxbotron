'use client';

import { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';

function CountryLabel({ code, name, truncate = false }: { code: string; name: string; truncate?: boolean }) {
  return (
    <>
      <span className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[2px] shadow-sm`} aria-hidden="true" />
      <span className={cn('min-w-0 text-left', truncate ? 'flex-1 truncate' : 'shrink-0 whitespace-nowrap')}>
        {name}
      </span>
      <span className="text-muted-foreground shrink-0">{code}</span>
    </>
  );
}

export default function CountryCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeValue, setActiveValue] = useState(value);
  const selected = countries.find((country) => country.code === value);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setActiveValue(value);
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full min-w-0 justify-between font-normal"
        >
          {selected ? (
            <CountryLabel code={selected.code} name={selected.name} truncate />
          ) : (
            <span className="text-muted-foreground">Select a country</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-max min-w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] p-0"
      >
        <Command value={activeValue} onValueChange={setActiveValue}>
          <CommandInput placeholder="Search country or code…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  keywords={[country.name]}
                  onSelect={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4 shrink-0', value === country.code ? 'opacity-100' : 'opacity-0')} />
                  <CountryLabel code={country.code} name={country.name} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
