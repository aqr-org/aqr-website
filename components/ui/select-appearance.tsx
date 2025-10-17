/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectAppearanceProps {
  children: React.ReactElement<HTMLSelectElement>;
  className?: string;
  placeholder?: string;
}

const SelectAppearance = React.forwardRef<
  HTMLDivElement,
  SelectAppearanceProps
>(({ children, className, placeholder = "Select an option...", ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");
  const [selectedText, setSelectedText] = React.useState(placeholder);
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Handle select changes
  const handleSelectChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    setSelectedValue(e.target.value);
    setSelectedText(selectedOption?.text || placeholder);
    setIsOpen(false);
    
    // Call original onChange if provided
    const originalOnChange = (children.props as any).onChange;
    if (originalOnChange) {
      originalOnChange(e);
    }
  }, [children.props, placeholder]);

  // Get options from the select element
const [options, setOptions] = React.useState<Array<{value: string, text: string, disabled: boolean}>>([]);

// Update options when select element is available
React.useEffect(() => {
  if (selectRef.current) {
    const newOptions = Array.from(selectRef.current.options).map((option) => ({
      value: option.value,
      text: option.text,
      disabled: option.disabled,
    }));
    setOptions(newOptions);
  }
}, []); // Run once when component mounts


  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const currentIndex = options.findIndex(opt => opt.value === selectedValue);
    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, options.length - 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case "Enter":
        e.preventDefault();
        if (currentIndex >= 0) {
          const option = options[currentIndex];
          if (!option.disabled) {
            selectRef.current?.dispatchEvent(
              new Event("change", { bubbles: true })
            );
            selectRef.current!.value = option.value;
            setSelectedValue(option.value);
            setSelectedText(option.text);
            setIsOpen(false);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < options.length) {
      const option = options[newIndex];
      if (!option.disabled) {
        selectRef.current!.value = option.value;
        setSelectedValue(option.value);
        setSelectedText(option.text);
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !document.querySelector('[data-select-dropdown]')?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Initialize selected value from select element
  React.useEffect(() => {
    if (selectRef.current) {
      const selectedOption = selectRef.current.options[selectRef.current.selectedIndex];
      if (selectedOption) {
        setSelectedValue(selectRef.current.value);
        setSelectedText(selectedOption.text);
      }
    }
  }, []);

  // Create a ref callback to handle both our ref and the child's ref
  const selectRefCallback = React.useCallback((node: HTMLSelectElement) => {
    selectRef.current = node;
    const childRef = (children as any).ref;
    if (childRef) {
      if (typeof childRef === "function") {
        childRef(node);
      } else {
        childRef.current = node;
      }
    }
  }, [children]);

  return (
    <div ref={ref} className={cn("group relative inline-block pl-3 pr-2 mx-1 hover:bg-qaupe rounded-lg", className, isOpen && "rounded-b-none rounded-t-lg bg-qaupe")} {...props}>
      {/* Hidden native select */}
      {React.cloneElement(children, {
        ref: selectRefCallback,
        style: {
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
          ...(children.props as any).style,
        },
        onChange: handleSelectChange,
      } as any)}
      
      {/* Custom trigger button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="select-options"
        className={cn(
          "inline-flex items-center justify-between bg-transparent my-1 font-[400] text-left transition-all",
          "disabled:pointer-events-none disabled:opacity-50",
          isOpen && "text-qreen"
        )}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={(children.props as any).disabled}
      >
        <span className={cn(
          "truncate pr-1",
          selectedValue === "" && "text-muted-foreground"
        )}>
          {selectedText}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 shrink-0 transition-transform relative -translate-y-[0.1em] group-hover:translate-y-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Custom dropdown */}
      {isOpen && (
        <div
          data-select-dropdown
          id="select-options"
          role="listbox"
          className="absolute z-50 -ml-3 max-h-60 overflow-auto bg-qaupe shadow-xl rounded-xl rounded-tl-none p-4"
        >
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === selectedValue}
              className={cn(
                "relative cursor-pointer rounded-lg select-none px-4 py-3 transition-colors whitespace-nowrap font-[400]",
                "hover:bg-qreen/10",
                "focus:bg-qreen focus:text-qaupe focus:outline-none",
                option.value === selectedValue && "text-qreen font-[600]",
                option.disabled && "pointer-events-none opacity-50"
              )}
              onClick={() => {
                if (!option.disabled) {
                  selectRef.current!.value = option.value;
                  selectRef.current?.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                  setSelectedValue(option.value);
                  setSelectedText(option.text);
                  setIsOpen(false);
                }
              }}
              onMouseEnter={(e) => {
                if (!option.disabled) {
                  e.currentTarget.focus();
                }
              }}
            >
              {option.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SelectAppearance.displayName = "SelectAppearance";

export { SelectAppearance };