import {z} from 'zod'

export const personalInfoSchema = z.object({
  first_name: z
    .string({
      required_error: 'Please enter your first name',
    })
    .min(1, {message: 'required*'}),
  last_name: z
    .string({
      required_error: 'Please enter your last name',
    })
    .min(1, {message: 'required*'}),
})

export const bookingDateSchema = z.object({
  selectedDate: z.string({
    required_error: 'Please select a date',
    invalid_type_error: 'required*',
  }),
  selectedTime: z.string({
    required_error: 'Please select a time',
    invalid_type_error: 'required*',
  }),
})

export const addressSchema = z.object({
  region_id: z.number({required_error: 'Please enter a Region'}).min(1),
  province_id: z.number({required_error: 'Please enter a Province'}).min(1),
  city_id: z.number({required_error: 'Please enter a City'}).min(1),
  barangay_id: z.number({required_error: 'Please enter a Barangay'}).min(1),
  address_line: z
    .string({required_error: 'Please enter a street address'})
    .min(5, {message: 'Length of Street/building name should be 5-200.'})
    .max(200),
  postal_code: z.coerce
    .number({required_error: 'Please enter a postal code'})
    .positive()
    .int()
    .max(9999, {message: 'Please fill valid postal code.'}),
  is_default: z.boolean(),
})

export const vehicleFormSchema = z.object({
  id: z.string(),
  brand_id: z.number(),
  model_id: z.number().min(1),
  year_model: z.string().min(1),
  plate_no: z.string().default(''),
})
