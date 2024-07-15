import { create } from 'zustand'
type BookingDate = {
  selectedDate: string
  selectedTime: string
}
interface CalendarStore {
  bookingDate: BookingDate | null
  setBookingDate: (data: BookingDate) => void
  clearBookingDate: () => void
}
export const useCalendarStore = create<CalendarStore>((set, get) => ({
  bookingDate: null,
  setBookingDate: (payload: BookingDate) => {
    set({ bookingDate: payload })
  },
  clearBookingDate: () => {
    set({ bookingDate: null })
  },
}))
