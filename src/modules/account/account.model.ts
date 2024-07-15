import { z } from 'zod'

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/,
)
export const phoneSchema = z.object({
  phone: z.string().min(10).max(14).regex(phoneRegex, 'Invalid Phone Number'),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, {
      message: 'Verification code must be 6 characters long',
    })
    .max(6),
})
