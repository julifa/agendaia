import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingCard } from "./BookingCard";
import type { Booking } from "../types/booking";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    serviceName: "Manicura Semipermanente",
    staffName: "Valentina",
    clientName: "Julieta",
    startTime: "2026-09-01T14:00:00Z",
    endTime: "2026-09-01T15:00:00Z",
    price: 12000,
    currency: "ARS",
    status: "pending",
    ...overrides,
  };
}

describe("BookingCard", () => {
  it("muestra servicio, profesional, cliente y precio formateado", () => {
    render(<BookingCard booking={makeBooking()} />);
    expect(screen.getByText("Manicura Semipermanente")).toBeInTheDocument();
    expect(screen.getByText("con Valentina")).toBeInTheDocument();
    expect(screen.getByText("Julieta")).toBeInTheDocument();
    expect(screen.getByText(/\$\s?12\.000,00/)).toBeInTheDocument();
  });

  it("muestra la etiqueta de estado correcta para cada status", () => {
    const { rerender } = render(<BookingCard booking={makeBooking({ status: "pending" })} />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    rerender(<BookingCard booking={makeBooking({ status: "confirmed" })} />);
    expect(screen.getByText("Confirmado")).toBeInTheDocument();

    rerender(<BookingCard booking={makeBooking({ status: "cancelled" })} />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it('solo muestra "Confirmar" cuando el turno está pending y hay onConfirm', () => {
    const onConfirm = vi.fn();
    render(<BookingCard booking={makeBooking({ status: "confirmed" })} onConfirm={onConfirm} />);
    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
  });

  it("dispara onConfirm con el id del turno al hacer click", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<BookingCard booking={makeBooking({ id: "abc123" })} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith("abc123");
  });

  it("no muestra acciones para turnos completados o cancelados", () => {
    render(
      <BookingCard
        booking={makeBooking({ status: "completed" })}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("no muestra acciones si no se pasan callbacks, aunque el turno esté activo", () => {
    render(<BookingCard booking={makeBooking({ status: "pending" })} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
