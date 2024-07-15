import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import React from 'react'
import { Accordion } from '../components/accordion'
import Markdown from 'react-native-markdown-display'
// 'To schedule an appointment, simply add your desired service to your cart. Your selected service will be added automatically. To review your requested services, click on the cart icon. After reviewing your selections, you can proceed to schedule your appointment.',
//Browse through our available services and find what you're looking for. \n• Click the "Add to Cart" button next to each service you desire.' \n• A cart tray will automatically appear on your screen, displaying your chosen services. \n2. Review Your Selections: \n• Click on the "Cart" icon to access a detailed overview of your selected services. \n• You can review the service descriptions, prices, and any additional information.\n• Once you're satisfied with your selections, you can proceed to schedule your appointment.\n3. Schedule Your Appointment:\n• Click on the "Get a Quote" button.\n• You will be directed to a page where you can confirm your address, phone number, vehicle information, and a summary of your selected services with the total amount.\n• Once everything is correct, click "Schedule" to be directed to the scheduling calendar. Choose your preferred date and time slot, then click "Done".\n• The appointment details will reappear for you to review. Once satisfied, click "Confirm and Book".\n• You will be redirected to the "Transactions" tab. Click "View Details" to expand the information, where you will find the status, order summary, and other relevant details. \n
const markdownTxt = {
  markdownTxtOne: `
1. **Add Services to Your Cart:**
      - Browse through our available services and find what you're looking for.
      - Click the "**Add to Cart**" button next to each service you desire.
      - A cart tray will automatically appear on your screen, displaying your chosen services.
2. **Review Your Selections:**
    - Click on the "**Cart**" icon to access a detailed overview of your selected services.
    - You can review the service descriptions, prices, and any additional information.
    - Once you're satisfied with your selections, you can proceed to schedule your appointment.
3. **Schedule Your Appointment:**
    - Click "**Get a Quote**" to confirm button.
    - Click "**Schedule**" to choose your appointment date and time.
    - Review your scheduled date and click "**done**".
    - The appointment details will reappear for you to review. Once satisfied, click "**Confirm and Book**".
    - You will be redirected to the "**Transactions**" tab. Click "**View Details**" to expand the information for status, summary, and more.
  `,
  markdownTxtTwo: `
In our mobile app, you'll find a wide array of automotive services designed to meet your needs. These services are neatly curated into 2 categories mainly Maintenance & Repair Services and Value Added Services for your convenience.
1. **Maintenance & Repair Services:**
    - Maintenance (change oil), 
    - Aircon
    - Tires & Wheels
    - Radiator Cooling System
    - Brake System
    - Clutch System
    - Engine
    - Electrical
    - Under Chassis
    - Steering Wheel
    - Battery
    - Transmission
2. Value Added Services:
    - Car Wash
    - Auto-Glass
    - Upholstery
    - Calibration
    - Painting
    - Denting
    - Accessories
    - Home Service

Other than these services, our app goes beyond scheduled services. 
**Introducing the Auto-Diagnostic Tool:** 

A helpful resource when immediate service is unavailable. It helps identify car issues, suggests temporary solutions, and provides valuable information, especially for new car owners facing unexpected troubles.
    `,
}

const FAQ = [
  {
    key: '1',
    label: 'How Do I Schedule an Appointment ?',
    content: markdownTxt.markdownTxtOne,
  },
  {
    key: '2',
    label: 'What types of services are available in the app ?',
    content: markdownTxt.markdownTxtTwo,
  },
  {
    key: '3',
    label: 'How can I track the progress of my service request ?',
    content:
      'Upon launching the application, you will be directed to the "**Orders Tab**", where you will find options for Active, History, and Completed Transactions. Within the Active tab, you can access transaction details and expand them for further information with a simple click.',
  },
  {
    key: '4',
    label: 'Do you offer emergency roadside assistance ?',
    content:
      'While emergency roadside assistance is not yet available on our mobile app, we are actively working to bring this important service to you. Stay tuned for further updates!',
  },
  {
    key: '5',
    label: 'How do I make payments through the app ?',
    content:
      'At this time, in the current version of the app, we would like to inform you that payments are not yet processed or accepted. All prices provided are estimates, and the final cost calculation will be conducted on the partnered repair shop`s. We appreciate your understanding and cooperation as we work to enhance your experience.',
  },
  // {
  //   key: '6',
  //   label: 'What are the operating hours of the service centers ?',
  //   content:
  //     'Our service center currently operates from 8 AM to 5 PM, Monday through Saturday. We are actively working on expanding our operating hours to provide you with a 24/7 service experience. Your convenience is our priority, and we appreciate your understanding as we strive to enhance our availability.',
  // },
  // {
  //   key: '7',
  //   label: 'Do you offer pick-up and drop-off services for my vehicle ?',
  //   content:
  //     'Yes, we provide pick-up and drop-off services for your convenience. Please note that the charges for the pick-up option are location-dependent and may vary accordingly.',
  // },
]
export function SupportScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text
          style={{
            color: '#09090b',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 15,
          }}>
          Frequently Asked Questions
        </Text>
        <Accordion.Root>
          {FAQ.map(({ key, label, content }) => (
            <Accordion.Item value={key} style={styles.itemContainer} key={key}>
              <Accordion.Trigger>
                <Accordion.Label
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={1.1}
                  style={{ color: '#09090b', fontWeight: '600', fontSize: 14 }}>
                  {label}
                </Accordion.Label>
                <Accordion.Chevron />
              </Accordion.Trigger>
              <Accordion.Content>
                <Markdown
                  style={{
                    text: {
                      color: '#333',
                      fontSize: 14,
                      lineHeight: 16,
                    },
                    bullet_list: {
                      fontSize: 14,
                      color: '#000',
                      paddingVertical: 5,
                    },
                  }}>
                  {content}
                </Markdown>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  itemContainer: {
    borderBottomWidth: 1,
    paddingBottom: 15,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'left',
    color: '#333',
  },
})
