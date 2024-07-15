const data = {
  message: 'Our services list',
  data: [

    
    {
      is_multi_select: 0,
      name: 'Scheduled Packages',
      is_tab_grid_view: false,
      services: [
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/01%20Standard%20Service.png',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          performance_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7126_Performance_Services_0.jpg?version=1657265210.918616',
                name: 'Coolant\\nTop Up (200 ml)',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Performance/Heater%20Spark%20Plugs%20Checking.jpg',
                name: 'Heater/Spark\\nPlugs Checking',
                id: 1,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7126_Performance_Services_2.jpg?version=1657265228.807151',
                name: 'Brake Fluid\\nTop Up',
                id: 2,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Performance/Cabin%20Filter_AC%20Filter%20Cleaning.jpg',
                name: 'AC Filter\\nCleaning',
                id: 3,
              },
            ],
            title: 'Performance Services',
          },
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          notify_title: 'Out of Stock',
          additional_services_inclusions: {
            inclusion: [
              'Car Scanning',
              'Wiper Fluid Replacement',
              'Battery Water Top up',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
              'Rear Brake Shoes Serviced',
              'Front Brake Pads Serviced',
            ],
            title: 'Additional Services',
          },
          name: 'Standard Service',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Standard%20Service.png',
          notify_text: "We'll notify of availability",
          description: 'Improves Car Performance',
          go_app_money_enable: false,
          type: 'package',
          price_details: [],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/02%20Engine%20Oil%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/03%20Oil%20Filter%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/04%20Air%20Filter%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/05%20Cabin%20Filter_AC%20Filter%20Cleaning.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/06%20Coolant%20Top%20Up.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/07%20Wiper%20Fluid%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/STANDARD%20SERVICES/08%20Brake%20Fluid%20Top%20Up.png',
          ],
          child_service_ids:
            '261,224,255,256,253,251,250,252,260,254,222,3198,259,258,6045',
          notify_button_text: 'Notify',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          booster_heading: 'For better performance & mileage',
          package_id: 2,
          brand_heading: 'Select Engine oil',
          essential_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Essential/Engine%20Oil%20Replacement.jpg',
                name: 'Engine Oil\\nReplacement',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7126_Essential_Services_1.jpg?version=1657265176.851707',
                name: 'Oil Filter\\nReplacement',
                id: 1,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7126_Essential_Services_2.jpg?version=1657265117.09633',
                name: 'Air Filter\\nReplacement',
                id: 2,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Essential/Fuel%20Filter%20Checking.jpg',
                name: 'Fuel Filter\\nChecking',
                id: 3,
              },
            ],
            title: 'Essential Services',
          },
          add_on_services: [
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'CNG'],
                [7125, 'Electric'],
                [7126, 'Electric'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7120,
                  strike_through: 899,
                  total: 649,
                  deal_id: 14,
                  strike_through_price: 899,
                  work_done: 4,
                  strikethrough: 899,
                },
              ],
              retail_name: 'AC Filter',
              add_on_category_id: 0,
              id: 7120,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 1,
              system: 'HEATING & AC SYSTEM',
              service_type_id: 4,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'AC Filter Replacement (OES)',
                  'AC Checkup, Refitting',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description:
                '30% Improvement in Car Breathing Air Quality',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/AC_Filter.png',
              category: 'Scheduled Services',
              booster_comment: '30% Improvement in Car Breathing Air Quality',
              name: 'AC Filter',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/AC%20Filter%20Sq.jpg',
              is_visible_on_lm: 1,
              description: 'AC Filter Replacement (OES), AC Checkup, Refitting',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Diesel'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7740,
                  strike_through: 1899,
                  total: 1400,
                  deal_id: 14,
                  strike_through_price: 1899,
                  work_done: 4,
                  strikethrough: 1899,
                },
              ],
              retail_name: 'Fuel Filter',
              id: 7740,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 0,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Fuel Filter Replacement (OES)',
                  'Opening & Fitting of Fuel Filter',
                ],
              },
              hsn: '8708',
              add_on_category_id: 0,
              booster_short_description: '30% Improvement in Car Mileage',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Fuel_Filter_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: '30% Improvement in Car Mileage',
              name: 'Fuel Filter',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Fuel Filter Replacement (OES), Opening & Fitting of Fuel Filter',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7207,
                  strike_through: 899,
                  total: 650,
                  deal_id: 14,
                  strike_through_price: 899,
                  work_done: 4,
                  strikethrough: 899,
                },
              ],
              retail_name: 'Wiper Blades',
              id: 7207,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 6,
              system: 'MISCELLANEOUS',
              service_type_id: 4,
              desc_details: {
                time_taken: 'Every 6 Months',
                interval: 'In case of Damaged Wipers',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Set of Wiper Blades Replacement (OES)',
                  'Opening & Fitting of Wiper Blade',
                ],
              },
              hsn: '7318',
              add_on_category_id: 0,
              booster_short_description: 'Prevents Windshield Scratches by 50%',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Wiper_Blades.png',
              category: 'Periodic Services',
              booster_comment: 'Prevents Windshield Scratches by 50%',
              name: 'Wiper Blades',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/WiperBlades/Wiper%20Blades%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description: 'Prevents Windshield Scratches by 50%',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7114,
                  strike_through: 1499,
                  total: 1099,
                  deal_id: 14,
                  strike_through_price: 1499,
                  work_done: 5.0,
                  strikethrough: 1499,
                },
              ],
              retail_name: 'Engine Flushing',
              add_on_category_id: 0,
              id: 7114,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 4,
              system: 'ENGINE',
              service_type_id: 7,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Engine Flushing',
                  'Deposits Removal',
                  'Engine Oil Leak Test',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '6768',
              booster_short_description:
                'Guaranteed Increase in Engine Performance',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Engine_Flushing.png',
              category: 'Scheduled Services',
              booster_comment: 'Guaranteed Increase in Engine Performance',
              name: 'Engine Flushing',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Engine%20Flushing.jpg',
              is_visible_on_lm: 1,
              description:
                'Engine Flushing, Deposit Build-up Removal, Engine Oil Leak Test',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7215,
                  strike_through: 1199,
                  total: 900,
                  deal_id: 14,
                  strike_through_price: 1199,
                  work_done: 4,
                  strikethrough: 1199,
                },
              ],
              retail_name: 'Gear Oil Replacement',
              add_on_category_id: 0,
              id: 7215,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 2,
              name: 'Gear Oil Replacement',
              service_type_id: 7,
              desc_details: {
                time_taken: '3 Hours',
                interval: 'Every 50000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Gear Oil (GM 80W90 Grade) Replacement',
                  'Draining & Refilling of Gear Oil',
                  'Automatic Transmission Gear Oil Rates may vary',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description: 'Decreases Gear Box Failure by 80%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Gear_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Decreases Gear Box Failure by 80%',
              system: 'Transmission System',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Gear%20Oil%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description:
                'Gear Oil Replacement, Draining & Refilling of Gear Oil, Automatic Transmission Gear Oil Rates may vary',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7113,
                  strike_through: 2199,
                  total: 1599,
                  deal_id: 14,
                  strike_through_price: 2199,
                  work_done: 4.0,
                  strikethrough: 2199,
                },
              ],
              retail_name: 'Brake Fluid Replacement',
              add_on_category_id: 0,
              id: 7113,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 9,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Brake Fluid Replacement',
                  'Brake Bleeding',
                  'Brakes Calibration',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '8708',
              booster_short_description:
                'Prevents Contamination of Brake Fluid',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Brake_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Prevents Contamination of Brake Fluid',
              name: 'Brake Fluid Replacement',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Brake Fluid Replacement, Brake Bleeding, Brake Servicing and Calibration',
            },
            {
              tax: 18,
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7126, 'Diesel'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Electric'],
                [7126, 'Electric'],
                [7125, 'Electric'],
              ],
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Power%20Steering.jpg',
              type: 'add_on',
              retail_name: 'Power Steering Service',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Power_Steering_Service.png',
              id: 7115,
              category: 'Scheduled Services',
              booster_comment: '20% decrease in chance of Steering Failure',
              system: 'STEERING SYSTEM',
              name: 'Power Steering Service',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '3 Months Warranty',
                inclusion: [
                  'Steering Fluid Replacement',
                  'Deposits Removal',
                  'Improved Steering Performance',
                ],
              },
              hsn: '7318',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7115,
                  strike_through: 2399,
                  total: 1799,
                  deal_id: 14,
                  strike_through_price: 2399,
                  work_done: 5.0,
                  strikethrough: 2399,
                },
              ],
              add_on_category_id: 0,
              order_in_sub_category: 8,
              description:
                'Steering Fluid Replacement, Deposit Build-up Removal, Better Steering Performace',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7112,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 5.0,
                  strikethrough: 1099,
                },
              ],
              retail_name: 'Radiator Cleaning',
              add_on_category_id: 0,
              id: 7112,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 7,
              name: 'Radiator Cleaning',
              service_type_id: 7,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Coolant Draining ',
                  'Anti - Freeze Coolant Replacement',
                  'Radiator Interior Cleaning',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description:
                'Increases Engine Cooling Capacity by 20%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Radiator_Cleaning.png',
              category: 'Scheduled Services',
              booster_comment: 'Increases Engine Cooling Capacity by 20%',
              system: 'RADIATOR',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Radiator%20Flushing.jpg',
              is_visible_on_lm: 1,
              description:
                'Coolant Draining, Anti- Freeze Coolant Replacement, Radiator Interior Cleaning, Coolant Leak Test',
            },
            {
              add_on_sub_category_id: 1,
              tax: 18,
              is_labour: 1,
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/serviceboostericons/Horn-Replacement.png',
              type: 'add_on',
              retail_name: 'GoMechanic Horn',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/GoMechanic_Horn.png',
              id: 8012,
              category: 'Periodic Services',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 8012,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 4,
                  strikethrough: 1099,
                },
              ],
              booster_comment: 'Prevents Road Accidents',
              system: 'MISCELLANEOUS',
              name: 'GoMechanic Horn',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'In case Horn is not working',
                warranty: '6 Months Warranty',
                inclusion: [
                  'GoMechanic Super Trumpet Horn Replacement (Set of 2)',
                  'Opening & Fitting of Bumper',
                ],
              },
              hsn: '7318',
              booster_short_description: 'Prevents Road Accidents',
              add_on_category_id: 0,
              order_in_sub_category: 10,
              description: 'Prevents Road Accidents',
            },
          ],
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          is_brand_service: 1,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 4165',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7126,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 30,
          service_slug: 'standard-car-service',
          sale_amount: 100,
          is_booster_service: 1,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          discount_text: '30% OFF',
          desc_details: {
            time_taken: '6 Hrs Taken',
            interval: 'Every 10,000 Kms or 6 Months (Recommended)',
            match: 'Free Pick-up & Drop',
            warranty: '1000 Kms or 1 Month Warranty',
            inclusion: [
              'Engine Oil Replacement',
              'Oil Filter Replacement',
              'Air Filter Replacement',
              'Fuel Filter Checking',
              'Cabin Filter / AC Filter Cleaning',
              'Coolant Top up (200 ml)',
              'Wiper Fluid Replacement',
              'Brake Fluid Top up (50 ml)',
              'Battery Water Top up',
              'Heater/Sparks Plugs Checking',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
              'Scanning',
              'Rear Brake Shoes Serviced',
              'Front Brake Pads Serviced',
            ],
          },
          desc_snippets: [
            'Every 10000 Kms / 6 Months',
            'Takes 6 Hours',
            '1 Month Warranty',
            'Includes 15 Services',
          ],
          service_compared_benefit: [
            {
              deeplink: null,
              text: 'Save Extra 15% with Miles Membership',
              color: '#3a9b14',
              type: 'miles',
              icon: 'https://storage.googleapis.com/gomechanic_assets/services_icon/miles.png',
            },
            {
              icon: 'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/percentageicon.png',
              type: 'authorised_service',
              text: 'Save \u20b9 1469 compared to Authorised Services',
            },
          ],
          all_add_ons: {
            cng_add_on: [
              7120, 7207, 7136, 7114, 7196, 7215, 7113, 7740, 7112, 8012,
            ],
            petrol_add_on: [
              7120, 7207, 7136, 7114, 7196, 7215, 7113, 7740, 7112, 8012,
            ],
            diesel_add_on: [
              7120, 7740, 7207, 7114, 7196, 7215, 7113, 7115, 7112, 8012,
            ],
            electric_add_on: [7120, 7207, 7113, 7115, 8012],
          },
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Standard%20Service%20Package%20sq.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Standard Service\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'Recommended',
          desc_tags: [
            'Every 10,000 kms',
            '6 months',
            'Air Filter cleaning',
            'Oil Filter replacement',
            'Engine Oil replacement',
            'Wiper Fluid replacement',
            'Battery Water topup',
            'Coolant topup',
            'Heater Plugs',
            'Car Wash',
            '90 Point Checklist',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 15% With Miles',
          video_url: [],
          image_url:
            'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Standard%20Service%20Package%20sq.jpg',
          package_details: [
            {
              labour_cost: 711,
              strike_through: 6999,
              material_cost: 4188,
              brand_oil_type: 'Mobil 5W30',
              brand_oil_name: 'Mineral Oil',
              total: 4899,
              brand: 'Mobil 5W30',
              oil_tag: 'RECOMMENDED',
              brand_1_price: 1200,
              brand_2_name: 'Mobil 1 0W40 Fully Synthetic',
              brand_1_description:
                'Best for Daily Commutes & Engine Protection',
              brand_2_oil_name: 'Fully Synthetic',
              brand_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 5W30 Mineral Oil',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Super Friction Fighter\u2122 Technology',
                  'Provides Longer Oil Drain Intervals',
                  'Moderate Viscosity Index Of 158',
                ],
              },
              strike_through_price: 6999,
              brand_1_oil_name: 'Synthetic Oil',
              brand_1_oil_type: 'Mobil 5W40',
              brand_2_price: 2600,
              deal_id: 14,
              recommended_brand: 'Mobil 5W30',
              brand_1_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 5W40 Semi Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Anti-Wear\u2122 Molecule Technology',
                  'Blended With Active Cleaning Agents',
                  'High Oil Viscosity Index Of 176',
                ],
              },
              flat_amc_discount: 0,
              brand_2_oil_type: 'Mobil1 0W40',
              percentage_amc_discount: 15,
              is_amc_discount: 1,
              brand_3_price: null,
              amc_discount_type: 'percentage',
              brand_3_name: null,
              package_id: 2,
              brand_1_name: 'Mobil 5W40 Semi Synthetic',
              strikethrough: 6999,
              brand_2_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 1 0W40 Fully Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Ultra Premium High-Performance Blend',
                  'Meets/Exceeds OEM Industry Specifics',
                  'High Oil Viscosity Index Of 185',
                ],
              },
              brand_2_description:
                'Engineered for Sludge Protection & 30% More Mileage',
              brand_description:
                'Exceptional Performance Boost & More Fuel Economy',
            },
          ],
          warranty_detail: [],
          no_of_brands: 3,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BASIC%20SERVICES/01%20Basic%20Service.png',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          performance_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7125_Performance_Services_0.jpg?version=1657265253.46549',
                name: 'Coolant\\nTop Up (200 ml)',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Performance/Heater%20Spark%20Plugs%20Checking.jpg',
                name: 'Heater/Spark\\nPlugs Checking',
                id: 1,
              },
            ],
            title: 'Performance Services',
          },
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          notify_title: 'Out of Stock',
          additional_services_inclusions: {
            inclusion: [
              'Wiper Fluid Replacement',
              'Battery Water Top Up',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
            ],
            title: 'Additional Services',
          },
          name: 'Basic Service',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Basic%20Service.png',
          notify_text: "We'll notify of availability",
          description: 'Every 5,000 kms or 3 months. 3 hours of service',
          type: 'package',
          price_details: [],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BASIC%20SERVICES/02%20Engine%20Oil%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BASIC%20SERVICES/03%20Oil%20Filter%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BASIC%20SERVICES/04%20Air%20Filter%20Cleaning.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BASIC%20SERVICES/05%20Coolant%20Top%20Up.png',
          ],
          child_service_ids: '224,253,251,5169,252,260,222,259,258',
          notify_button_text: 'Notify',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          booster_heading: 'For better performance & mileage',
          package_id: 1,
          brand_heading: 'Select Engine oil',
          essential_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7125_Essential_Services_0.jpg?version=1639385004.96861',
                name: 'Engine Oil\\nReplacement',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7125_Essential_Services_1.jpg?version=1657265041.55665',
                name: 'Oil Filter\\nReplacement',
                id: 1,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7125_Essential_Services_2.jpg?version=1657265070.015719',
                name: 'Air Filter\\nCleaning',
                id: 2,
              },
            ],
            title: 'Essential Services',
          },
          add_on_services: [
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'CNG'],
                [7125, 'Electric'],
                [7126, 'Electric'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7120,
                  strike_through: 899,
                  total: 649,
                  deal_id: 14,
                  strike_through_price: 899,
                  work_done: 4,
                  strikethrough: 899,
                },
              ],
              retail_name: 'AC Filter',
              add_on_category_id: 0,
              id: 7120,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 1,
              system: 'HEATING & AC SYSTEM',
              service_type_id: 4,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'AC Filter Replacement (OES)',
                  'AC Checkup, Refitting',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description:
                '30% Improvement in Car Breathing Air Quality',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/AC_Filter.png',
              category: 'Scheduled Services',
              booster_comment: '30% Improvement in Car Breathing Air Quality',
              name: 'AC Filter',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/AC%20Filter%20Sq.jpg',
              is_visible_on_lm: 1,
              description: 'AC Filter Replacement (OES), AC Checkup, Refitting',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Diesel'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7740,
                  strike_through: 1899,
                  total: 1400,
                  deal_id: 14,
                  strike_through_price: 1899,
                  work_done: 4,
                  strikethrough: 1899,
                },
              ],
              retail_name: 'Fuel Filter',
              id: 7740,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 0,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Fuel Filter Replacement (OES)',
                  'Opening & Fitting of Fuel Filter',
                ],
              },
              hsn: '8708',
              add_on_category_id: 0,
              booster_short_description: '30% Improvement in Car Mileage',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Fuel_Filter_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: '30% Improvement in Car Mileage',
              name: 'Fuel Filter',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Fuel Filter Replacement (OES), Opening & Fitting of Fuel Filter',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7207,
                  strike_through: 899,
                  total: 650,
                  deal_id: 14,
                  strike_through_price: 899,
                  work_done: 4,
                  strikethrough: 899,
                },
              ],
              retail_name: 'Wiper Blades',
              id: 7207,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 6,
              system: 'MISCELLANEOUS',
              service_type_id: 4,
              desc_details: {
                time_taken: 'Every 6 Months',
                interval: 'In case of Damaged Wipers',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Set of Wiper Blades Replacement (OES)',
                  'Opening & Fitting of Wiper Blade',
                ],
              },
              hsn: '7318',
              add_on_category_id: 0,
              booster_short_description: 'Prevents Windshield Scratches by 50%',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Wiper_Blades.png',
              category: 'Periodic Services',
              booster_comment: 'Prevents Windshield Scratches by 50%',
              name: 'Wiper Blades',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/WiperBlades/Wiper%20Blades%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description: 'Prevents Windshield Scratches by 50%',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7114,
                  strike_through: 1499,
                  total: 1099,
                  deal_id: 14,
                  strike_through_price: 1499,
                  work_done: 5.0,
                  strikethrough: 1499,
                },
              ],
              retail_name: 'Engine Flushing',
              add_on_category_id: 0,
              id: 7114,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 4,
              system: 'ENGINE',
              service_type_id: 7,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Engine Flushing',
                  'Deposits Removal',
                  'Engine Oil Leak Test',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '6768',
              booster_short_description:
                'Guaranteed Increase in Engine Performance',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Engine_Flushing.png',
              category: 'Scheduled Services',
              booster_comment: 'Guaranteed Increase in Engine Performance',
              name: 'Engine Flushing',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Engine%20Flushing.jpg',
              is_visible_on_lm: 1,
              description:
                'Engine Flushing, Deposit Build-up Removal, Engine Oil Leak Test',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7215,
                  strike_through: 1199,
                  total: 900,
                  deal_id: 14,
                  strike_through_price: 1199,
                  work_done: 4,
                  strikethrough: 1199,
                },
              ],
              retail_name: 'Gear Oil Replacement',
              add_on_category_id: 0,
              id: 7215,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 2,
              name: 'Gear Oil Replacement',
              service_type_id: 7,
              desc_details: {
                time_taken: '3 Hours',
                interval: 'Every 50000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Gear Oil (GM 80W90 Grade) Replacement',
                  'Draining & Refilling of Gear Oil',
                  'Automatic Transmission Gear Oil Rates may vary',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description: 'Decreases Gear Box Failure by 80%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Gear_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Decreases Gear Box Failure by 80%',
              system: 'Transmission System',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Gear%20Oil%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description:
                'Gear Oil Replacement, Draining & Refilling of Gear Oil, Automatic Transmission Gear Oil Rates may vary',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7113,
                  strike_through: 2199,
                  total: 1599,
                  deal_id: 14,
                  strike_through_price: 2199,
                  work_done: 4.0,
                  strikethrough: 2199,
                },
              ],
              retail_name: 'Brake Fluid Replacement',
              add_on_category_id: 0,
              id: 7113,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 9,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Brake Fluid Replacement',
                  'Brake Bleeding',
                  'Brakes Calibration',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '8708',
              booster_short_description:
                'Prevents Contamination of Brake Fluid',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Brake_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Prevents Contamination of Brake Fluid',
              name: 'Brake Fluid Replacement',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Brake Fluid Replacement, Brake Bleeding, Brake Servicing and Calibration',
            },
            {
              tax: 18,
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7126, 'Diesel'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Electric'],
                [7126, 'Electric'],
                [7125, 'Electric'],
              ],
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Power%20Steering.jpg',
              type: 'add_on',
              retail_name: 'Power Steering Service',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Power_Steering_Service.png',
              id: 7115,
              category: 'Scheduled Services',
              booster_comment: '20% decrease in chance of Steering Failure',
              system: 'STEERING SYSTEM',
              name: 'Power Steering Service',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '3 Months Warranty',
                inclusion: [
                  'Steering Fluid Replacement',
                  'Deposits Removal',
                  'Improved Steering Performance',
                ],
              },
              hsn: '7318',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7115,
                  strike_through: 2399,
                  total: 1799,
                  deal_id: 14,
                  strike_through_price: 2399,
                  work_done: 5.0,
                  strikethrough: 2399,
                },
              ],
              add_on_category_id: 0,
              order_in_sub_category: 8,
              description:
                'Steering Fluid Replacement, Deposit Build-up Removal, Better Steering Performace',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7112,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 5.0,
                  strikethrough: 1099,
                },
              ],
              retail_name: 'Radiator Cleaning',
              add_on_category_id: 0,
              id: 7112,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 7,
              name: 'Radiator Cleaning',
              service_type_id: 7,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Coolant Draining ',
                  'Anti - Freeze Coolant Replacement',
                  'Radiator Interior Cleaning',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description:
                'Increases Engine Cooling Capacity by 20%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Radiator_Cleaning.png',
              category: 'Scheduled Services',
              booster_comment: 'Increases Engine Cooling Capacity by 20%',
              system: 'RADIATOR',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Radiator%20Flushing.jpg',
              is_visible_on_lm: 1,
              description:
                'Coolant Draining, Anti- Freeze Coolant Replacement, Radiator Interior Cleaning, Coolant Leak Test',
            },
            {
              add_on_sub_category_id: 1,
              tax: 18,
              is_labour: 1,
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/serviceboostericons/Horn-Replacement.png',
              type: 'add_on',
              retail_name: 'GoMechanic Horn',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/GoMechanic_Horn.png',
              id: 8012,
              category: 'Periodic Services',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 8012,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 4,
                  strikethrough: 1099,
                },
              ],
              booster_comment: 'Prevents Road Accidents',
              system: 'MISCELLANEOUS',
              name: 'GoMechanic Horn',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'In case Horn is not working',
                warranty: '6 Months Warranty',
                inclusion: [
                  'GoMechanic Super Trumpet Horn Replacement (Set of 2)',
                  'Opening & Fitting of Bumper',
                ],
              },
              hsn: '7318',
              booster_short_description: 'Prevents Road Accidents',
              add_on_category_id: 0,
              order_in_sub_category: 10,
              description: 'Prevents Road Accidents',
            },
          ],
          retail_service_type_id: 0,
          is_amc_enabled: 0,
          is_brand_service: 1,
          id: 7125,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 25,
          service_slug: 'basic-car-service',
          sale_amount: 100,
          is_booster_service: 1,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          discount_text: '25% OFF',
          desc_details: {
            time_taken: '4 Hrs Taken',
            interval: 'Every 5000 Kms or 3 Months (Recommended)',
            match: 'Free Pick-up & Drop',
            warranty: '1000 Kms or 1 Month Warranty',
            inclusion: [
              'Engine Oil Replacement',
              'Oil Filter Replacement',
              'Air Filter Cleaning',
              'Coolant Top up',
              'Wiper Fluid Replacement',
              'Battery Water Top up',
              'Heater/ Spark Plugs Checking',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
            ],
          },
          desc_snippets: [
            'Every 5000 Kms / 3 Months',
            'Takes 4 Hours',
            '1 Month Warranty',
            'Includes 9 Services',
          ],
          service_compared_benefit: [
            {
              icon: 'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/percentageicon.png',
              type: 'authorised_service',
              text: 'Save \u20b9 1109 compared to Authorised Services',
            },
          ],
          all_add_ons: {
            cng_add_on: [
              7120, 7207, 7136, 7114, 7196, 7215, 7113, 7740, 7112, 8012,
            ],
            petrol_add_on: [
              7120, 7207, 7136, 7114, 7196, 7215, 7113, 7740, 7112, 8012,
            ],
            diesel_add_on: [
              7120, 7740, 7207, 7114, 7196, 7215, 7113, 7115, 7112, 8012,
            ],
            electric_add_on: [7120, 7207, 7113, 7115, 8012],
          },
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Basic Service\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: '',
          desc_tags: [
            'Every 5,000 kms',
            '3 months',
            'Air Filter cleaning',
            'Oil Filter replacement',
            'Engine Oil replacement',
            'Wiper Fluid replacement',
            'Battery Water topup',
            'Coolant topup',
            'Heater Plugs',
            'Car Wash',
            '90 Point Checklist',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 15% With Miles',
          video_url: [],
          image_url:
            'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
          package_details: [
            {
              labour_cost: 435,
              strike_through: 4932,
              material_cost: 3264,
              brand_oil_type: 'Mobil 5W30',
              flat_amc_discount: 0,
              total: 3699,
              brand: 'Mobil 5W30',
              oil_tag: 'RECOMMENDED',
              brand_1_price: 1200,
              brand_2_name: 'Mobil 1 0W40 Fully Synthetic',
              brand_1_description:
                'Best for Daily Commutes & Engine Protection',
              percentage_amc_discount: 15,
              brand_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 5W30 Mineral Oil',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Super Friction Fighter\u2122 Technology',
                  'Provides Longer Oil Drain Intervals',
                  'Moderate Viscosity Index Of 158',
                ],
              },
              strike_through_price: 4932,
              brand_1_oil_name: 'Synthetic Oil',
              brand_1_oil_type: 'Mobil 5W40',
              brand_2_price: 2600,
              deal_id: 14,
              recommended_brand: 'Mobil 5W30',
              brand_1_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 5W40 Semi Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Anti-Wear\u2122 Molecule Technology',
                  'Blended With Active Cleaning Agents',
                  'High Oil Viscosity Index Of 176',
                ],
              },
              brand_oil_name: 'Mineral Oil',
              brand_2_oil_type: 'Mobil1 0W40',
              brand_2_oil_name: 'Fully Synthetic',
              is_amc_discount: 0,
              brand_3_price: null,
              amc_discount_type: 'percentage',
              brand_3_name: null,
              package_id: 1,
              brand_1_name: 'Mobil 5W40 Semi Synthetic',
              strikethrough: 4932,
              brand_2_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 1 0W40 Fully Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Ultra Premium High-Performance Blend',
                  'Meets/Exceeds OEM Industry Specifics',
                  'High Oil Viscosity Index Of 185',
                ],
              },
              brand_2_description:
                'Engineered for Sludge Protection & 30% More Mileage',
              brand_description:
                'Exceptional Performance Boost & More Fuel Economy',
            },
          ],
          warranty_detail: [],
          no_of_brands: 3,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/01%20Comprehensive%20Service.png',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          performance_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Performance_Services_0.jpg?version=1657265289.713726',
                name: 'Coolant\\nTop Up (200 ml)',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Performance/Heater%20Spark%20Plugs%20Checking.jpg',
                name: 'Heater/Spark\\nPlugs Checking',
                id: 1,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Performance_Services_2.jpg?version=1657265300.642954',
                name: 'Brake Fluid\\nTop Up',
                id: 2,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Performance_Services_3.jpg?version=1655123367.725097',
                name: 'Fuel Filter\\nChecking',
                id: 3,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Performance_Services_4.jpg?version=1660716278.479757',
                name: 'Engine Flushing',
                id: 4,
              },
            ],
            title: 'Performance Services',
          },
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          notify_title: 'Out of Stock',
          additional_services_inclusions: {
            inclusion: [
              'AC Filter Replacement',
              'Fuel Filter Checking',
              'Car Scanning',
              'Wiper Fluid Replacement',
              'Battery Water Top up',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
              'Rear Brake Shoes Serviced',
              'Front Brake Pads Serviced',
              'Wheel Balancing',
              'Wheel Alignment',
              'Tyre Rotation',
            ],
            title: 'Additional Services',
          },
          name: 'Comprehensive Service',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Comprehensive%20Service.png',
          notify_text: "We'll notify of availability",
          description: 'Every 20,000 kms or 12 months. 6 hours of service',
          go_app_money_enable: false,
          type: 'package',
          price_details: [],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/02%20Engine%20Oil%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/03%20Oil%20Filter%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/04%20Air%20Filter%20Replacement.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/12%20Interior%20Vacuuming.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/13%20Scanning.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/14%20Brake%20Pads%20Serviced.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/15%20Wheel%20Balancing.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/16%20Wheel%20Alignment.png',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/COMPREHENSIVE%20SERVICES/17%20Throttle%20Valve%20Cleaning.png',
          ],
          child_service_ids:
            '261,224,255,256,253,251,250,252,2168,260,5170,222,3198,259,258,257,264,265,262,6045',
          notify_button_text: 'Notify',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          booster_heading: 'For better performance & mileage',
          package_id: 3,
          brand_heading: 'Select Engine oil',
          essential_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Standard%20Service/Essential/Engine%20Oil%20Replacement.jpg',
                name: 'Engine Oil\\nReplacement',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Essential_Services_1.jpg?version=1657265271.399611',
                name: 'Oil Filter\\nReplacement',
                id: 1,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Essential_Services_2.jpg?version=1657265279.178682',
                name: 'Air Filter\\nReplacement',
                id: 2,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gm-retail-app/service_tbl_images/0_1_7127_Essential_Services_3.jpg?version=1655123394.167922',
                name: 'AC Filter\\nReplacement',
                id: 3,
              },
            ],
            title: 'Essential Services',
          },
          add_on_services: [
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Diesel'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7740,
                  strike_through: 1899,
                  total: 1400,
                  deal_id: 14,
                  strike_through_price: 1899,
                  work_done: 4,
                  strikethrough: 1899,
                },
              ],
              retail_name: 'Fuel Filter',
              id: 7740,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 0,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Fuel Filter Replacement (OES)',
                  'Opening & Fitting of Fuel Filter',
                ],
              },
              hsn: '8708',
              add_on_category_id: 0,
              booster_short_description: '30% Improvement in Car Mileage',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Fuel_Filter_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: '30% Improvement in Car Mileage',
              name: 'Fuel Filter',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Fuel Filter Replacement (OES), Opening & Fitting of Fuel Filter',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7207,
                  strike_through: 899,
                  total: 650,
                  deal_id: 14,
                  strike_through_price: 899,
                  work_done: 4,
                  strikethrough: 899,
                },
              ],
              retail_name: 'Wiper Blades',
              id: 7207,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 6,
              system: 'MISCELLANEOUS',
              service_type_id: 4,
              desc_details: {
                time_taken: 'Every 6 Months',
                interval: 'In case of Damaged Wipers',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Set of Wiper Blades Replacement (OES)',
                  'Opening & Fitting of Wiper Blade',
                ],
              },
              hsn: '7318',
              add_on_category_id: 0,
              booster_short_description: 'Prevents Windshield Scratches by 50%',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Wiper_Blades.png',
              category: 'Periodic Services',
              booster_comment: 'Prevents Windshield Scratches by 50%',
              name: 'Wiper Blades',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/WiperBlades/Wiper%20Blades%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description: 'Prevents Windshield Scratches by 50%',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7215,
                  strike_through: 1199,
                  total: 900,
                  deal_id: 14,
                  strike_through_price: 1199,
                  work_done: 4,
                  strikethrough: 1199,
                },
              ],
              retail_name: 'Gear Oil Replacement',
              add_on_category_id: 0,
              id: 7215,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 2,
              name: 'Gear Oil Replacement',
              service_type_id: 7,
              desc_details: {
                time_taken: '3 Hours',
                interval: 'Every 50000 Kms or 12 Months',
                warranty: '1 Month Warranty',
                inclusion: [
                  'Gear Oil (GM 80W90 Grade) Replacement',
                  'Draining & Refilling of Gear Oil',
                  'Automatic Transmission Gear Oil Rates may vary',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description: 'Decreases Gear Box Failure by 80%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Gear_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Decreases Gear Box Failure by 80%',
              system: 'Transmission System',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Gear%20Oil%20Replacement%20Sq.jpg',
              is_visible_on_lm: 1,
              description:
                'Gear Oil Replacement, Draining & Refilling of Gear Oil, Automatic Transmission Gear Oil Rates may vary',
            },
            {
              is_labour: 1,
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7113,
                  strike_through: 2199,
                  total: 1599,
                  deal_id: 14,
                  strike_through_price: 2199,
                  work_done: 4.0,
                  strikethrough: 2199,
                },
              ],
              retail_name: 'Brake Fluid Replacement',
              add_on_category_id: 0,
              id: 7113,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 9,
              system: 'BRAKE',
              service_type_id: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Brake Fluid Replacement',
                  'Brake Bleeding',
                  'Brakes Calibration',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '8708',
              booster_short_description:
                'Prevents Contamination of Brake Fluid',
              tax: 18,
              add_on_sub_category_id: 1,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Brake_Fluid_Replacement.png',
              category: 'Scheduled Services',
              booster_comment: 'Prevents Contamination of Brake Fluid',
              name: 'Brake Fluid Replacement',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Brake%20Fluid%20Repalcement.JPG',
              is_visible_on_lm: 1,
              description:
                'Brake Fluid Replacement, Brake Bleeding, Brake Servicing and Calibration',
            },
            {
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7125, 'Petrol'],
                [7125, 'CNG'],
                [7126, 'Diesel'],
                [7126, 'Petrol'],
                [7126, 'CNG'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
              ],
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7112,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 5.0,
                  strikethrough: 1099,
                },
              ],
              retail_name: 'Radiator Cleaning',
              add_on_category_id: 0,
              id: 7112,
              retail_service_type_id: 0,
              icon_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/periodic.svg',
              order_in_sub_category: 7,
              name: 'Radiator Cleaning',
              service_type_id: 7,
              desc_details: {
                time_taken: '',
                interval: 'Every 10000 Kms or 6 Months',
                warranty: '1000 Kms Warranty',
                inclusion: [
                  'Coolant Draining ',
                  'Anti - Freeze Coolant Replacement',
                  'Radiator Interior Cleaning',
                ],
              },
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              hsn: '7318',
              booster_short_description:
                'Increases Engine Cooling Capacity by 20%',
              tax: 18,
              type: 'add_on',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Radiator_Cleaning.png',
              category: 'Scheduled Services',
              booster_comment: 'Increases Engine Cooling Capacity by 20%',
              system: 'RADIATOR',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Radiator%20Flushing.jpg',
              is_visible_on_lm: 1,
              description:
                'Coolant Draining, Anti- Freeze Coolant Replacement, Radiator Interior Cleaning, Coolant Leak Test',
            },
            {
              tax: 18,
              is_labour: 1,
              add_on_service_with_car_type: [
                [7125, 'Diesel'],
                [7126, 'Diesel'],
                [7127, 'Diesel'],
                [7127, 'Petrol'],
                [7127, 'CNG'],
                [7127, 'Electric'],
                [7126, 'Electric'],
                [7125, 'Electric'],
              ],
              deeplink:
                'https://gomechanic.in/?pagename=addtocart&parent_id=0&service_id=7126',
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/boosterimages/Power%20Steering.jpg',
              type: 'add_on',
              retail_name: 'Power Steering Service',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/Power_Steering_Service.png',
              id: 7115,
              category: 'Scheduled Services',
              booster_comment: '20% decrease in chance of Steering Failure',
              system: 'STEERING SYSTEM',
              name: 'Power Steering Service',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'Every 20000 Kms or 12 Months',
                warranty: '3 Months Warranty',
                inclusion: [
                  'Steering Fluid Replacement',
                  'Deposits Removal',
                  'Improved Steering Performance',
                ],
              },
              hsn: '7318',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 7115,
                  strike_through: 2399,
                  total: 1799,
                  deal_id: 14,
                  strike_through_price: 2399,
                  work_done: 5.0,
                  strikethrough: 2399,
                },
              ],
              add_on_category_id: 0,
              order_in_sub_category: 8,
              description:
                'Steering Fluid Replacement, Deposit Build-up Removal, Better Steering Performace',
            },
            {
              add_on_sub_category_id: 1,
              tax: 18,
              is_labour: 1,
              image_url:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/serviceboostericons/Horn-Replacement.png',
              type: 'add_on',
              retail_name: 'GoMechanic Horn',
              booster_icon:
                'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/GoMechanic_Horn.png',
              id: 8012,
              category: 'Periodic Services',
              add_on_price_details: [
                {
                  car_id: 109,
                  service_id: 8012,
                  strike_through: 1099,
                  total: 799,
                  deal_id: 14,
                  strike_through_price: 1099,
                  work_done: 4,
                  strikethrough: 1099,
                },
              ],
              booster_comment: 'Prevents Road Accidents',
              system: 'MISCELLANEOUS',
              name: 'GoMechanic Horn',
              service_type_id: 4,
              is_visible_on_lm: 1,
              desc_details: {
                time_taken: '',
                interval: 'In case Horn is not working',
                warranty: '6 Months Warranty',
                inclusion: [
                  'GoMechanic Super Trumpet Horn Replacement (Set of 2)',
                  'Opening & Fitting of Bumper',
                ],
              },
              hsn: '7318',
              booster_short_description: 'Prevents Road Accidents',
              add_on_category_id: 0,
              order_in_sub_category: 10,
              description: 'Prevents Road Accidents',
            },
          ],
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          is_brand_service: 1,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 6290',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7127,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          longride_services_inclusions: {
            inclusions: [
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Comprehensive%20Service/Long%20Ride/Throttle%20Body%20Cleaning.jpg',
                name: 'Throttle Body\\nCleaning',
                id: 0,
              },
              {
                image:
                  'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Additional%20Images%20Periodic%20Service/Comprehensive%20Service/Long%20Ride/Gear%20Oil%20Top%20Up.jpg',
                name: 'Gear Oil\\nTop Up',
                id: 1,
              },
            ],
            title: 'Long Ride Services',
          },
          discount_percent: 30,
          service_slug: 'comprehensive-car-service',
          sale_amount: 100,
          is_booster_service: 1,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          discount_text: '30% OFF',
          desc_details: {
            time_taken: '8 Hrs Taken',
            interval: 'Every 20,000 Kms or 12 Months (Recommended)',
            match: 'Free Pick-up & Drop',
            warranty: '1000 Kms or 1 Month Warranty',
            inclusion: [
              'Engine Oil Replacement',
              'Oil Filter Replacement',
              'Air Filter Replacement',
              'Fuel Filter Replacement',
              'Cabin Filter / AC Filter Cleaning',
              'Coolant Top up (200 ml)',
              'Wiper Fluid Replacement',
              'Brake Fluid Top up(50 ml)',
              'Battery Water Top up',
              'Heater / Spark Plugs Checking',
              'Car Wash',
              'Interior Vacuuming ( Carpet & Seats )',
              'Scanning',
              'Rear Brake Shoes Serviced',
              'Front Brake Pads Serviced',
              'Wheel Balancing',
              'Wheel Alignment',
              'Tyre Rotation',
              'Throttle Body Cleaning',
              'Gear Oil Top up',
            ],
          },
          desc_snippets: [
            'Every 20000 Kms / 1 Year',
            'Takes 8 Hours',
            '1 Month Warranty',
            'Includes 20 Services',
          ],
          service_compared_benefit: [
            {
              deeplink: null,
              text: 'Save Extra 15% with Miles Membership',
              color: '#3a9b14',
              type: 'miles',
              icon: 'https://storage.googleapis.com/gomechanic_assets/services_icon/miles.png',
            },
            {
              icon: 'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/percentageicon.png',
              type: 'authorised_service',
              text: 'Save \u20b9 2219 compared to Authorised Services',
            },
          ],
          all_add_ons: {
            cng_add_on: [7207, 7136, 7196, 7215, 7113, 7740, 7112, 7115, 8012],
            petrol_add_on: [
              7207, 7136, 7196, 7215, 7113, 7740, 7112, 7115, 8012,
            ],
            diesel_add_on: [7740, 7207, 7196, 7215, 7113, 7112, 7115, 8012],
            electric_add_on: [7207, 7113, 7115, 8012],
          },
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Comprehensive%20Service%20Package%202%20sq.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Comprehensive Service\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'Free AC Gas Top-Up',
          desc_tags: [
            'Every 40,000 kms',
            '12 months',
            'Air Filter cleaning',
            'Oil Filter replacement',
            'Engine Oil replacement',
            'Wiper Fluid replacement',
            'Battery Water topup',
            'Coolant topup',
            'Heater Plugs',
            'Car Wash',
            '90 Point Checklist',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 15% With Miles',
          video_url: [],
          image_url:
            'https://gomechprod.blob.core.windows.net/gm-retail-app/service-new-images/Comprehensive%20Service%20Package%202%20sq.jpg',
          package_details: [
            {
              labour_cost: 748,
              strike_through: 10570,
              material_cost: 6651,
              brand_oil_type: 'Mobil 5W30',
              brand_oil_name: 'Mineral Oil',
              total: 7399,
              brand: 'Mobil 5W30',
              oil_tag: 'RECOMMENDED',
              brand_1_price: 1150,
              brand_2_name: 'Mobil 1 0W40 Fully Synthetic',
              brand_1_description:
                'Best for Daily Commutes & Engine Protection',
              brand_2_oil_name: 'Fully Synthetic',
              brand_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mineral Oil',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Super Friction Fighter\u2122 Technology',
                  'Provides Longer Oil Drain Intervals',
                  'Moderate Viscosity Index Of 158',
                ],
              },
              strike_through_price: 10570,
              brand_1_oil_name: 'Synthetic Oil',
              brand_1_oil_type: 'Mobil 5W40',
              brand_2_price: 2550,
              deal_id: 14,
              recommended_brand: 'Mobil 5W30',
              brand_1_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 5W40 Semi Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Mobil Anti-Wear\u2122 Molecule Technology',
                  'Blended With Active Cleaning Agents',
                  'High Oil Viscosity Index Of 176',
                ],
              },
              flat_amc_discount: 0,
              brand_2_oil_type: 'Mobil1 0W40',
              percentage_amc_discount: 15,
              is_amc_discount: 1,
              brand_3_price: null,
              amc_discount_type: 'percentage',
              brand_3_name: null,
              package_id: 3,
              brand_1_name: 'Mobil 5W40 Semi Synthetic',
              strikethrough: 10570,
              brand_2_pop_up: {
                name: 'Mobil 5W30 ',
                header: 'Mobil 1 0W40 Fully Synthetic',
                image:
                  'https://s3.ap-south-1.amazonaws.com/gm-retail-app/service-new-images/Basic%20Service%20Package%20sq.jpg',
                description: [
                  'Ultra Premium High-Performance Blend',
                  'Meets/Exceeds OEM Industry Specifics',
                  'High Oil Viscosity Index Of 185',
                ],
              },
              brand_2_description:
                'Engineered for Sludge Protection & 30% More Mileage',
              brand_description:
                'Exceptional Performance Boost & More Fuel Economy',
            },
          ],
          warranty_detail: [],
          no_of_brands: 3,
          out_of_stock_sub_text: 'Remind Me',
        },
      ],
      sub_category_id: 1,
      category_id: 0,
      booster_subtitle: 'Select from the most popular service boosters',
      sub_category_image:
        'https://gomechprod.blob.core.windows.net/gm-retail-app/cms_sub_category_images/Periodic_Services_0_Scheduled_Packages_1.jpg?version=1704270992.591777',
      tab_grid_number: 3,
      category_name: 'Periodic Services',
      booster_title: 'Top Trending Boosters',
      sub_cat_tab_icon:
        'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/all_sub_cat_tab_icons/Scheduled%20packages.jpg',
      service_collection: 'package_tbl',
    },
    {
      is_multi_select: 1,
      sub_category_image:
        'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Sub%20Category%20Images/02.jpg',
      name: 'Brake Maintenance',
      service_collection: 'service_tbl',
      is_tab_grid_view: false,
      sub_category_id: 2,
      category_name: 'Periodic Services',
      services: [
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Front%20Brake%20Pads%20Sq%20(1).jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Front Brake Pads',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Front%20Brake%20Pads.png',
          notify_text: "We'll notify of availability",
          description:
            'Includes: Opening & Fitting of Brakes, Front Brake Pads Replacement (OES), Front Brake Disc Cleaning',
          type: 'Service',
          price_details: [
            {
              labour_cost: 449,
              strike_through: 2599,
              material_cost: 1630,
              flat_amc_discount: 0,
              total: 2079,
              brand: 'Brake Pad Replacement',
              brand_1_price: 799.0,
              brand_2_name: null,
              percentage_amc_discount: 10,
              is_amc_discount: 1,
              brand_2_price: null,
              brand_3_price: null,
              recommended_brand: 'Add On : Brake Disc Turning',
              strike_through_price: 2599,
              service_id: 7109,
              brand_1_description:
                'Brake Discs Polishing ( 2 Discs ). Lubrication & Inspection',
              brand_3_name: null,
              deal_id: 14,
              brand_1_name: 'Add On : Brake Disc Turning',
              amc_discount_type: 'percentage',
              strikethrough: 2599,
              brand_description:
                'Genuine Brake Pad Replacement with Disc Inspection',
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Front%20Brake%20Disc%20Cleaning.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Opening%20And%20Fitting%20Of%20Brakes.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Opening%20And%20Fitting%20Of%20Brakes1.jpg',
          ],
          child_service_ids: '4503,4504,4505,4506,4507,4508,4509,226',
          notify_button_text: 'Notify',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          brand_heading: 'Brake Pad Replacement Add on',
          add_on_services: [],
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          is_brand_service: 0,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 1872',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7109,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'car-front-brake-pads',
          sale_amount: 100,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 3 Hours ',
            inclusion: [
              'Opening & Fitting of Front Brake Pads',
              'Front Brake Pads Replacement (GoMechanic)',
              'Applicable for Set of 2 Front Brake Pads',
              'Inspection of Front Brake Calipers',
              'Front Brake Disc Cleaning',
            ],
            match: '',
            warranty: '1 Month Warranty',
            interval: 'Every 20000 Kms or 12 Months (Recommended)',
          },
          desc_snippets: [
            'Takes 3 Hours',
            '1 Month Warranty',
            'For Both Front Wheels',
          ],
          service_compared_benefit: [
            {
              deeplink: null,
              text: 'Save Extra 10% with Miles Membership',
              color: '#3a9b14',
              type: 'miles',
              icon: 'https://storage.googleapis.com/gomechanic_assets/services_icon/miles.png',
            },
            {
              icon: 'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/services_icon/percentageicon.png',
              type: 'authorised_service',
              text: 'Save \u20b9 519 compared to Authorised Services',
            },
          ],
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Front%20Brake%20Pads%20Sq%20(1).jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Front Brake Pads\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'GoMechanic Exclusive',
          desc_tags: [
            'Opening & Fitting of Brakes',
            'Front Brake Pads Replacements',
            'Brake Disc Inspection',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 10% with Miles Membership',
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Front%20Brake%20Pads%20Sq%20(1).jpg',
          package_details: [],
          warranty_detail: [],
          no_of_brands: 2,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Brake%20Shoe%20Thumbnail.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Rear Brake Shoes',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Rear%20Brake%20Shoes.png',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Brake%20Shoe%20Thumbnail.jpg',
          description:
            'Includes: Opening & Fitting of Brakes, Rear Brake Shoes Replacement (OES), Rear Brake Disc Cleaning',
          type: 'Service',
          price_details: [
            {
              labour_cost: 549,
              strike_through: 2874,
              material_cost: 1750,
              flat_amc_discount: 0,
              total: 2299,
              brand: 'Brake Shoes Replacement',
              brand_1_price: 799.0,
              brand_2_name: null,
              percentage_amc_discount: 10,
              is_amc_discount: 1,
              brand_2_price: null,
              brand_3_price: null,
              recommended_brand: 'Add On : Brake Disc Turning',
              strike_through_price: 2874,
              service_id: 7110,
              brand_1_description:
                'Brake Discs Polishing ( 2 Discs ). Lubrication & Inspection',
              brand_3_name: null,
              deal_id: 14,
              brand_1_name: 'Add On : Brake Disc Turning',
              amc_discount_type: 'percentage',
              strikethrough: 2874,
              brand_description:
                'Genuine Brake Shoes Replacement with Disc Inspection',
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Rear%20Brake%20Disc%20Cleaning.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Rear%20Brake%20Disc%20Replacement.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Rear%20Brake%20Disc%20Replacement1.jpg',
          ],
          child_service_ids: '4503,4504,4505,4506,4507,4508,4509,226',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          brand_heading: 'Brake Shoes Replacement Add on\t\t',
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          is_brand_service: 0,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 2070',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7110,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'car-rear-brake-shoes',
          sale_amount: 100,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 3 Hours ',
            interval: 'Every 20000 Kms or 12 Months (Recommended)',
            match: '',
            warranty: '1 Month Warranty',
            inclusion: [
              'Opening & Fitting of Rear Brake Pads',
              'Rear Brake Shoes Replacement (OES)',
              'Applicable for Set of 2 Rear Brake Pads',
              'Inspection of Rear Brake Calipers',
              'Rear Brake Disc Cleaning',
            ],
          },
          desc_snippets: [
            'Takes 3 Hours',
            '1 Month Warranty',
            'For Both Rear Wheels',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/BrakePads/Brake%20Shoe%20Thumbnail.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Rear Brake Shoes\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'Labour Included',
          desc_tags: [
            'Opening & Fitting of Brakes',
            'Front Brake Pads Replacements',
            'Brake Disc Inspection',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 10% with Miles Membership',
          add_on_services: [],
          package_details: [],
          warranty_detail: [],
          no_of_brands: 2,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/Thumbnail.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          already_notified: false,
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Front Brake Discs',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Front%20Brake%20Discs.png',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/Thumbnail.jpg',
          description:
            'Includes: Front Brake Disc Replacement (Single OES Unit), Opening & Fitting of Front Brake Disc, Reduces Vibrations and Brake Noises, Increases Brake Life & Safety, Free Pickup & Drop',
          type: 'Service',
          price_details: [
            {
              labour_cost: 2200,
              strike_through: 2750,
              total: 2200,
              material_cost: 0,
              deal_id: 14,
              recommended_brand: '',
              is_amc_discount: 1,
              service_id: 7181,
              flat_amc_discount: 0,
              amc_discount_type: 'percentage',
              brand: null,
              strike_through_price: 2750,
              strikethrough: 2750,
              percentage_amc_discount: 10,
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/1.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/2.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/3.jpg',
          ],
          child_service_ids: '4503,4504,4505,4506,4507,4508,4509,226',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          max_counts: 2,
          brand_heading: 'Brake Shoes Replacement Add on\t\t',
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 1980',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7181,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'front-brake-disc-replacement',
          sale_amount: 100,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 5 Hours ',
            interval: 'Corrosion Resistance',
            match: 'Prevents Braking System Failure',
            warranty: '1 Month Warranty',
            inclusion: [
              'Front Brake Disc Replacement (Single OES Unit)',
              'Opening & Fitting of Front Brake Disc',
              'Reduces Vibrations and Brake Noises',
              'Increases Brake Life & Safety',
              'Free Pickup & Drop',
            ],
          },
          desc_snippets: [
            'Takes 5 Hours',
            '1 Month Warranty',
            'Cost For Single Wheel',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Front%20Disc%20Brake/Thumbnail.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Front Brake Discs\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'Labour Included',
          desc_tags: [
            'Front Brake Disc Replacement (1 Disc)',
            'Opening & Fitting of Front Brake Disc',
            'Reduces Vibrations and Brake Noises',
            'Increases Brake Life & Safety',
            'Free Pickup & Drop',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 10% with Miles Membership',
          add_on_services: [],
          package_details: [],
          warranty_detail: [],
          is_count_service: 1,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/Thumbnail.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Caliper Pin Replacement',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Front%20Brake%20Discs.png',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/Thumbnail.jpg',
          description:
            'Includes: Front Brake Disc Replacement (Single OES Unit), Opening & Fitting of Front Brake Disc, Reduces Vibrations and Brake Noises, Increases Brake Life & Safety, Free Pickup & Drop',
          type: 'Service',
          price_details: [
            {
              labour_cost: 0,
              strike_through: 1000,
              material_cost: 800,
              deal_id: 14,
              recommended_brand: '',
              strike_through_price: 1000,
              service_id: 8199,
              total: 800,
              brand: null,
              strikethrough: 1000,
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/1.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/2.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/3.jpg',
          ],
          child_service_ids: '4503,4504,4505,4506,4507,4508,4509,226',
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          max_counts: 2,
          brand_heading: 'Brake Shoes Replacement Add on\t\t',
          retail_service_type_id: 0,
          is_amc_enabled: 0,
          id: 8199,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'caliper-pin-replacement',
          sale_amount: 100,
          already_notified: false,
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 6 Hours ',
            interval: 'Recommended : In case of Noise coming from Brakes',
            match: 'Recommended : In case of Brake Failure',
            warranty: '',
            inclusion: [
              'Caliper Pin Replacement (OES)',
              'Opening & Fitting of Caliper Pin',
              'Caliper Assembly Cost Additional ',
              'Free Pickup & Drop',
            ],
          },
          desc_snippets: [
            'Takes 6 Hours',
            '1 Month Warranty',
            'Prevent Brake Failure',
            'Cost For Single Wheel',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Caliper%20Pin%20Replacement/Thumbnail.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Caliper Pin Replacement\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'New',
          desc_tags: [
            'Caliper Pin Replacement (OES)',
            'Opening & Fitting of Caliper Pin',
            'Caliper Assy Cost Additional ',
            'Free Pickup & Drop',
          ],
          is_amc_service: false,
          add_on_services: [],
          package_details: [],
          warranty_detail: [],
          is_count_service: 1,
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/1%20resurfacing.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Disc Turning',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/disc%20turning.jpg',
          description:
            'Includes: Opening & Fitting + Inspection Of Below Items, Resurfacing of Brake Discs/Rotors, Applicable For Set of 2 Discs',
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          type: 'Service',
          price_details: [
            {
              labour_cost: 0,
              strike_through: 1374,
              total: 1099,
              material_cost: 1099,
              deal_id: 14,
              recommended_brand: '',
              is_amc_discount: 1,
              service_id: 7140,
              flat_amc_discount: 0,
              amc_discount_type: 'percentage',
              brand: null,
              strike_through_price: 1374,
              strikethrough: 1374,
              percentage_amc_discount: 10,
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/2%20set%20of%202.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/Service%20Benefits.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/Timelines.jpg',
          ],
          warranty_detail: [],
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 990',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7140,
          sale_amount: 100,
          discount_percent: 20,
          service_slug: 'car-disc-turning',
          already_notified: false,
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 4 Hours',
            interval: '',
            match: 'Spare Part Charges will be Extra',
            warranty: '1 Month Warranty on Labour',
            inclusion: [
              'Opening & Fitting of Brake Discs',
              'Inspection of Brake Discs',
              'Applicable For Set of 2 Discs (2 Wheels)',
              'Resurfacing of Brake Discs/Rotors',
            ],
          },
          desc_snippets: [
            'Takes 4 Hours',
            '1 Month Warranty on Labour',
            'For Both Front Wheels',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Overhaul%20Services/Disc%20Turning/disc%20turning.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Disc Turning\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          desc_tags: [
            'Resurfacing of Brake Discs/Rotors',
            'Applicable For Set of 2 Discs',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 10% with Miles Membership',
          add_on_services: [],
          package_details: [],
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Disc%20Turning.png',
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/Thumbnail.jpg',
          retail_service_type_id: 0,
          issues: [],
          parent_id: 0,
          is_amc_enabled: 0,
          notify_title: 'Out of Stock',
          already_notified: false,
          id: 8000,
          sale_text: 'Use FREEWIPER get wiper blade',
          service_chat_url: 'https://support.gomechanic.app/chat',
          is_amc_service: false,
          discount_percent: 25,
          name: 'Handbrake Wire Replacement',
          service_slug: 'handbrake-wire-replacement',
          sale_amount: 100,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Disc%20Turning.png',
          desc_details: {
            time_taken: 'Takes 4 Hours',
            interval: 'Recommended : In Case Handbrake Stops Working',
            match:
              "Recommended : In Case Handbrake Won't Fully Engage or Disengage",
            warranty: '',
            inclusion: [
              'Handbrake Wire Replacement (Single OES Unit)',
              'Brake Drum Inspection',
              'Electronic Parking Brake Cost Additonal',
              'Wheel Cylinder, Ratchet, Clamps Cost Additional',
              'Free Pickup & Drop',
            ],
          },
          notify_text: "We'll notify of availability",
          out_of_stock_title: 'OUT OF STOCK',
          desc_snippets: ['Takes 4 Hours', '1 Month Warranty'],
          add_on_services: [],
          description:
            'Includes: Opening & Fitting + Inspection Of Below Items, Resurfacing of Brake Discs/Rotors, Applicable For Set of 2 Discs',
          tax: 18,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/Thumbnail.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Handbrake Wire Replacement\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          type: 'Service',
          price_details: [
            {
              labour_cost: 1859,
              strike_through: 2479,
              material_cost: 0,
              deal_id: 14,
              recommended_brand: '',
              strike_through_price: 2479,
              service_id: 8000,
              total: 1859,
              brand: null,
              strikethrough: 2479,
            },
          ],
          notify_toast: 'Notification On',
          rate_card_images: null,
          service_tag: 'NEW',
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/1.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/2.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/3.jpg',
          ],
          desc_tags: [
            'Handbrake Wire Replacement (Single OES Unit)',
            'Brake Drum Inspection',
            'Electronic Parking Brake Cost Additonal',
            'Wheel Cylinder, Ratchet, Clamps Cost Additional',
            'Free Pickup & Drop',
          ],
          sale_status: false,
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Hand%20Brake%20/Thumbnail.jpg',
          package_details: [],
          discount_text: '25% OFF',
          warranty_detail: [],
          notify_button_text: 'Notify',
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/Thumbnail2.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Brake Drums Turning',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/Thumbnail2.jpg',
          description: 'Brake Drums Turning',
          warranty_detail: [],
          type: 'custom_new_paid',
          price_details: [
            {
              labour_cost: 0,
              strike_through: 1374,
              total: 1099,
              material_cost: 1099,
              deal_id: 14,
              recommended_brand: '',
              is_amc_discount: 1,
              service_id: 7214,
              flat_amc_discount: 0,
              amc_discount_type: 'percentage',
              brand: null,
              strike_through_price: 1374,
              strikethrough: 1374,
              percentage_amc_discount: 10,
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/1.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/2.jpg',
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/3.jpg',
          ],
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          retail_service_type_id: 0,
          is_amc_enabled: 1,
          detail_page_miles_strip: {
            sub_title: 'Get this service as low as \u20b9 990',
            deeplink:
              'https://gomechanic.in/?pagename=AMC_FRAGMENT&subpagename=JOINNOW_JOINNOW',
            title: 'Upgrade to Miles Membership',
          },
          id: 7214,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'car-brake-drums-turning',
          sale_amount: 100,
          already_notified: false,
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 4 Hours',
            interval: 'Recommended : In Case of Screeching Noise from Brakes',
            match: 'Spare Part Charges will be Extra',
            warranty: '1 Month Warranty',
            inclusion: [
              'Brake Drums Turning',
              'Opening & Fitting of Brake Drums',
              'Refacing of Brake Drums',
              'Applicable for Set of 2 Brake Drums',
              'Free Pickup & Drop',
            ],
          },
          desc_snippets: [
            'Takes 4 Hours',
            '1 Month Warranty on Labour',
            'For Both Rear Wheels',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Brake%20Drums/Thumbnail2.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Brake Drums Turning\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: '',
          desc_tags: [
            'Brake Drums Turning',
            'Opening & Fitting of Brake Drums',
            'Refacing of Brake Drums',
            'Applicable for Set of 2 Drums',
            'Free Pickup & Drop',
          ],
          is_amc_service: false,
          amc_text: 'Save Extra 10% with Miles Membership',
          add_on_services: [],
          package_details: [],
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Brake%20Drums%20Turning.png',
          out_of_stock_sub_text: 'Remind Me',
        },
        {
          imp_note:
            'For additional repair services, price may vary based on inspection.',
          services_assets:
            'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/thumbnail.jpg',
          sale_text: 'Use FREEWIPER get wiper blade',
          issues: [],
          parent_id: 0,
          service_chat_url_with_login:
            'https://support.gomechanic.app/chat/phoneno',
          service_chat_url: 'https://support.gomechanic.app/chat',
          out_of_stock_title: 'OUT OF STOCK',
          discount_text: '20% OFF',
          name: 'Wheel Cylinder Replacement',
          service_banner_image:
            'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/Benefits%20Icon%20Categories/Periodic%20Services/Brake%20Drums%20Turning.png',
          notify_text: "We'll notify of availability",
          image_url:
            'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/thumbnail.jpg',
          description: 'Wheel Cylinder Replacement',
          type: 'custom_new_paid',
          price_details: [
            {
              labour_cost: 0,
              strike_through: 1551,
              material_cost: 1241,
              deal_id: 14,
              recommended_brand: '',
              strike_through_price: 1551,
              service_id: 8211,
              total: 1241,
              brand: null,
              brand_1_price: null,
              brand_1_name: null,
              strikethrough: 1551,
            },
          ],
          sale_status: false,
          carousel_images: [
            'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/1.jpg',
            'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/2.jpg',
            'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/3.jpg',
          ],
          installation_steps: {
            steps: [
              {
                step_no: '1',
                text: 'A Dedicated Service Buddy will arrange a doorstep pick-up from your location.',
              },
              {
                step_no: '2',
                text: 'Your Car will be serviced at the nearest GoMechanic Workshop.',
              },
              {
                step_no: '3',
                text: 'Any additional work will be notified and authorised by you.',
              },
              {
                step_no: '4',
                text: "We'll doorstep deliver your Car in the specified service time.",
              },
            ],
            title: 'Steps After Booking',
          },
          service_banner_image_title: 'GoMechanic Benefits',
          max_counts: 2,
          retail_service_type_id: 0,
          is_amc_enabled: 0,
          id: 8211,
          custom_chat_url:
            'https://support.gomechanic.app/custom-chat?service_id=serviceid',
          discount_percent: 20,
          service_slug: 'car-brake-drums-turning',
          sale_amount: 100,
          already_notified: false,
          notify_title: 'Out of Stock',
          desc_details: {
            time_taken: 'Takes 6 Hours',
            interval: 'Recommended : In case of Poor Braking',
            match: 'Recommended : In case of Brake Fluid Leakage',
            warranty: '',
            inclusion: [
              'Wheel Cylinder Replacement (OES)',
              'Opening & Fitting of Wheel Cylinder',
              'Brake Shoe & Brake Fluid Cost Additional',
              'Free Pickup & Drop',
            ],
          },
          desc_snippets: [
            'Takes 6 Hours',
            '1 Month Warranty',
            'Prevents Brake Failure',
          ],
          notify_button_text: 'Notify',
          tax: 18,
          referral_data: {
            referral_image:
              'https://gomechprod.blob.core.windows.net/gm-retail-app/retailservices/wheel%20cylinder%20replacement/thumbnail.jpg',
            amount: 1000,
            title:
              "I think your Car \ud83d\ude97 would love this Wheel Cylinder Replacement\ud83d\udee0\ufe0f\n\n {pUrl}  \n\n Don't forget to use my *Referral Code : * \ud83c\udf81 & *Get a Free Inspection* \n\n {appLink}",
          },
          rate_card_images: null,
          notify_toast: 'Notification On',
          service_tag: 'New',
          desc_tags: [
            'Wheel Cylinder Replacement (OES)',
            'Opening & Fitting of Wheel Cylinder',
            'Brake Shoe & Brake Fluid Cost Additional',
            'Free Pickup & Drop',
          ],
          is_amc_service: false,
          add_on_services: [],
          package_details: [],
          warranty_detail: [],
          is_count_service: 1,
          out_of_stock_sub_text: 'Remind Me',
        },
      ],
      tab_grid_number: 3,
      sub_cat_tab_icon:
        'https://gomechprod.blob.core.windows.net/gomech-retail/gomechanic_assets/all_sub_cat_tab_icons/Brake%20Maintainence.jpg',
      category_id: 0,
    },
  ],
  status: true,
}
