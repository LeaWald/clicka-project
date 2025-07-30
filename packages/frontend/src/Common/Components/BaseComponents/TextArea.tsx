import React from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import { useTheme } from "../themeConfig";

interface TextAreaFieldProps {
    name: string;
    label: string;
    required?: boolean;
    value?: string;
    disabled?: boolean;
    dir?: 'rtl' | 'ltr';
    className?: string;
    "data-testid"?: string;
    defaultValue?: string;
    placeholder?: string;
    rows?: number;
    minHeight?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
    name,
    label,
    required,
    disabled,
    dir,
    className,
    "data-testid": testId,
    defaultValue,
    placeholder,
    rows = 8,
    minHeight = 120,
}) => {
    const { theme } = useTheme();
    const {
        register,
        formState: { errors },
    } = useFormContext();
    const error = errors[name]?.message as string | undefined;
    const effectiveDir = dir || theme.direction;

    return (
        <div className="space-y-1 w-full" dir={effectiveDir}>
            <label
                className="block text-sm font-medium text-gray-700"
                style={{
                    fontFamily:
                        effectiveDir === "rtl"
                            ? theme.typography.fontFamily.hebrew
                            : theme.typography.fontFamily.latin,
                }}
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                {...register(name)}
                disabled={disabled}
                aria-required={required}
                aria-invalid={!!error}
                aria-label={label}
                data-testid={testId}
                defaultValue={defaultValue}
                placeholder={placeholder}
                rows={rows}
                className={clsx(
                    "w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition resize-vertical",
                    error
                        ? `border-[${theme.colors.semantic.error}] focus:ring-[${theme.colors.semantic.error}]`
                        : `border-gray-300 focus:ring-[${theme.colors.primary}]`,
                    className
                )}
                style={{
                    minHeight,
                    fontFamily:
                        effectiveDir === "rtl"
                            ? theme.typography.fontFamily.hebrew
                            : theme.typography.fontFamily.latin,
                }}
            />
            {error && (
                <p
                    className="text-sm"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                    style={{ color: theme.colors.semantic.error }}
                >
                    {error}
                </p>
            )}
        </div>
    );
};
