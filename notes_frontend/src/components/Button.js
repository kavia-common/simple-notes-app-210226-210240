import React from "react";
import "./Button.css";

/**
 * @param {{
 *  variant?: "primary" | "ghost" | "danger",
 *  size?: "sm" | "md",
 *  type?: "button" | "submit" | "reset",
 *  disabled?: boolean,
 *  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
 *  children: React.ReactNode,
 *  title?: string,
 *  ariaLabel?: string,
 * }} props
 */
// PUBLIC_INTERFACE
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  children,
  title,
  ariaLabel
}) {
  /** Reusable retro button with consistent focus styles. */
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
