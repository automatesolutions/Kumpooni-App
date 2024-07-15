import { RepairStatus } from '../types/automate'
import { colors } from './styles'

//https://github.com/bluesky-social/social-app/blob/main/src/view/com/util/forms/Button.tsx#L163
export function choose<U, T extends Record<string, U>>(
  value: keyof T,
  choices: T,
): U {
  return choices[value]
}

export function dedupArray<T>(arr: T[]): T[] {
  const s = new Set(arr)
  return [...s]
}

export function getRepairOrderStatusColor(status: RepairStatus) {
  let statusStyle = {
    color: '#000',
  }
  switch (status) {
    case 'Cancelled':
      statusStyle.color = colors.error
      break
    case 'Completed':
      statusStyle.color = colors.green
      break
    default:
      break
  }
  return statusStyle
}

export function buttonStyle(status: RepairStatus) {
  let buttonColor, textColor, title
  switch (status) {
    case 'Scheduled':
      buttonColor = '#16CA5E'
      textColor = '#000'
      title = 'Upcoming Appointments'
      break
    case 'Awaiting Parts':
      buttonColor = colors.orange
      textColor = colors.orange
      title = 'Ongoing Services'
      // Set the text color for INFO status
      break
    case 'In Progress':
      buttonColor = colors.info
      textColor = colors.info
      title = 'Ongoing Services'
      // Set the text color for INFO status
      break
    case 'Completed':
      buttonColor = colors.green
      textColor = colors.green
      title = 'Completed Service'
      break
    case 'Cancelled':
      buttonColor = colors.primary
      textColor = colors.primary
      title = 'Cancelled Service'
      // Set the text color for GREEN status
      break
    default:
      buttonColor = colors.palette.neutral300
      textColor = colors.palette.neutral400
      title = 'Upcoming Appointments'
    // Set the text color for other statuses
  }

  return { buttonColor, textColor, title }
}
