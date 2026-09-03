import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TermsModal from './TermsModal';

describe('TermsModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<TermsModal isOpen={false} onAccept={vi.fn()} />);
    expect(screen.queryByText(/Публичная оферта и правила/i)).not.toBeInTheDocument();
  });

  it('renders terms, disclaimer and disables accept button until checkbox is checked', () => {
    const handleAccept = vi.fn();
    render(<TermsModal isOpen={true} onAccept={handleAccept} isReadonly={false} />);

    expect(screen.getByText(/Публичная оферта и правила/i)).toBeInTheDocument();
    expect(screen.getByText(/Образовательно-развлекательный проект/i)).toBeInTheDocument();
    expect(screen.getByText(/Отсутствие ликвидности/i)).toBeInTheDocument();
    expect(screen.getByText(/Изолированная среда/i)).toBeInTheDocument();
    expect(screen.getByText(/Отказ от ответственности/i)).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /Принять и продолжить/i });
    expect(acceptBtn).toBeDisabled();

    // Check the agreement checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(acceptBtn).not.toBeDisabled();

    // Click accept
    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
  });

  it('renders readonly mode with close button', () => {
    const handleClose = vi.fn();
    render(<TermsModal isOpen={true} onClose={handleClose} isReadonly={true} />);

    expect(screen.getByText(/Публичная оферта и правила/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Принять и продолжить/i })).not.toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: /Закрыть/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
