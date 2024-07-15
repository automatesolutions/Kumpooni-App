const data = {
  quoteSignature: '266496731-C6KJCVDTR7B1CJ',
  merchants: [
    {
      ID: '2-CY2XLNAFLAXELA',
      name: "Jollibee - Lopue's San Sebastian",
      available: true,
      items: [
        {
          ID: 'PHITE20211031180154541816',
          quantity: 1,
          name: '6pc Chickenjoy Solo',
          available: true,
          priceInMinorUnit: 52800,
          modifierGroups: [
            {
              ID: 'PHMOD20210415024835066375',
              name: 'Chickenjoy Flavor:',
              available: true,
              selectionRangeMin: 1,
              selectionRangeMax: 1,
              modifiers: [
                {
                  ID: 'PHMOD20230831162021040243',
                  name: 'Original',
                  available: true,
                  quantity: 1,
                  metadata: '{}',
                  priceV2: { amountDisplay: '0.00' },
                },
              ],
            },
            {
              ID: 'PHMOD20210415024834092862',
              name: 'Extras:',
              available: true,
              selectionRangeMax: 2,
              modifiers: [
                {
                  ID: 'PHMOD20230717114314235641',
                  name: 'Extra Rice',
                  available: true,
                  quantity: 1,
                  priceInMinorUnit: 3400,
                  totalPriceInMinorUnit: 3400,
                  metadata: '{}',
                  taxedTotalPriceInMinorUnit: 3400,
                  simplePriceInMinorUnit: 3400,
                  priceV2: { amountInMinor: 3400, amountDisplay: '34.00' },
                },
              ],
            },
          ],
          totalPriceInMinorUnit: 52800,
          simplePriceInMinorUnit: 49400,
          metadata:
            '{"moderation":{"status":"PASS","mode":"AUTO","client":"food-cms-upload"}}',
          totalReducedPriceInMin: 52800,
          priceV2: { amountInMinor: 52800, amountDisplay: '₱528.00' },
          totalPriceV2: { amountInMinor: 52800, amountDisplay: '528.00' },
          simplePriceV2: { amountInMinor: 49400, amountDisplay: '494.00' },
          totalReducedPriceV2: {
            amountInMinor: 52800,
            amountDisplay: '528.00',
          },
          taxedTotalPriceInMin: 52800,
          taxedTotalPriceV2: { amountInMinor: 52800, amountDisplay: '528.00' },
          category: 'Family Meals',
          merchantID: '2-CY2XLNAFLAXELA',
          categoryID: 'PHCAT20210415024804112999',
          portion: 1,
          simplePriceInMinBeforeMarkdown: 49400,
          simpleReducedPriceInMin: 49400,
          simpleReducedPriceV2: {
            amountInMinor: 49400,
            amountDisplay: '494.00',
          },
          keyword: ['Family', 'Meals'],
          maxStock: -1,
          photos: [
            'https://d1sag4ddilekf6.cloudfront.net/item/PHITE20211029214042014898/photos/fd5ed654c7124a259b76d4072c3044a9_1707798082886883413.jpg',
          ],
          itemMetaKey:
            'PHITE20211031180154541816:,PHMOD20230831162021040243,1,PHMOD20230717114314235641,1',
        },
      ],
      location: {
        longitude: 122.9447094,
        latitude: 10.666039909090909,
        address:
          'San Sebastian, Corner Araneta Streets, Bacolod City, Bacolod, 6100, Bacolod, 6100',
        keywords: "Jollibee - Lopue's San Sebastian",
        poiID: 'IT.FOOD_FAKEID_2-CY2XLNAFLAXELA',
      },
      orderType: 'INTEGRATED',
      merchantETA: {
        minETAInMinute: 70,
        maxETAInMinute: 70,
        distanceInMetre: 356,
        directDistanceInMetre: 361,
        deliveryETAInMinute: 2,
        minPTAInMinute: 70,
        maxPTAInMinute: 70,
        merchantETABreakDown: {
          allocationTime: { value: 8, version: 'v1' },
          pickUpTimeMin: { value: 480, version: 'nearby_matrix' },
          pickUpTimeMax: { value: 480, version: 'nearby_matrix' },
          dropOffTime: { value: 127, version: 'nearby_matrix' },
          dynamicBuffer: { value: 745, version: 'padding' },
          merchantOrderReady: { value: 3600, version: 'fpt_v1' },
          dynamicBufferPadding: { version: 'padding' },
        },
      },
      useStoreDelivery: 'INACTIVE',
      orderValueLimit: 300000,
      itemGroups: [
        {
          totalPriceV2: { amountInMinor: 52800, amountDisplay: '528.00' },
          totalReducedPriceV2: {
            amountInMinor: 52800,
            amountDisplay: '528.00',
          },
          itemKeysInGroup: [
            'PHITE20211031180154541816:,PHMOD20230831162021040243,1,PHMOD20230717114314235641,1',
          ],
        },
      ],
    },
  ],
  destination: {
    longitude: 122.9463107,
    latitude: 10.6688878,
    address:
      'Gonzaga St, Brgy. 36, Barangay 21 (Pob.), Bacolod City, Negros Occidental, 6100, Western Visayas (Region VI), Philippines',
    poiID: 'IT.2GQI9G8L0OAG1',
  },
  promoCodes: null,
  paymentTypeID: '',
  foodQuote: {
    priceInMinorUnit: 52800,
    reducedPriceInMinorUnit: 52800,
    priceV2: { amountInMinor: 52800, amountDisplay: '₱528.00' },
    reducedPriceV2: { amountInMinor: 52800, amountDisplay: '₱528.00' },
    taxV2: { amountDisplay: '0.00' },
    promoAmountV2: { amountDisplay: '0.00' },
    inclTaxV2: { amountDisplay: '0.00' },
    priceAfterCampaignInMinorUnit: 52800,
    priceAfterCampaignInMinorUnitV2: {
      amountInMinor: 52800,
      amountDisplay: '₱528.00',
    },
    priceAfterOrderLevelCampaignInMinorUnit: 52800,
    priceAfterOrderLevelCampaignInMinorUnitV2: {
      amountInMinor: 52800,
      amountDisplay: '₱528.00',
    },
    priceAfterOrderLevelCampaignInMajorUnit: 528,
  },
  deliveryQuote: {
    priceInMinorUnit: 3500,
    reducedPriceInMinorUnit: 3500,
    priceV2: { amountInMinor: 3500, amountDisplay: '35.00' },
    reducedPriceV2: { amountInMinor: 3500, amountDisplay: '35.00' },
    taxV2: { amountDisplay: '0.00' },
    promoAmountV2: { amountDisplay: '0.00' },
    inclTaxV2: { amountDisplay: '0.00' },
    priceAfterCampaignInMinorUnit: 3500,
    priceAfterCampaignInMinorUnitV2: {
      amountInMinor: 3500,
      amountDisplay: '35.00',
    },
    priceAfterOrderLevelCampaignInMinorUnitV2: { amountDisplay: '0.00' },
    reducedPriceWithoutCondition: {
      amountInMinor: 3500,
      amountDisplay: '₱35.00',
    },
  },
  currency: { symbol: 'P', exponent: 2, code: 'PHP', ISOSymbol: '₱' },
  countryCode: 'PH',
  suggestGPPromos: [],
  comment: '',
  errReasons: null,
  campaigns: null,
  totalQuote: {
    priceInMinorUnit: 56300,
    reducedPriceInMinorUnit: 56300,
    priceV2: { amountInMinor: 56300, amountDisplay: '₱563.00' },
    reducedPriceV2: { amountInMinor: 56300, amountDisplay: '₱563.00' },
    taxV2: { amountDisplay: '0.00' },
    promoAmountV2: { amountDisplay: '0.00' },
    inclTaxV2: { amountDisplay: '0.00' },
    priceAfterCampaignInMinorUnitV2: { amountDisplay: '₱0.00' },
    priceAfterOrderLevelCampaignInMinorUnitV2: { amountDisplay: '₱0.00' },
  },
  errMessage: null,
  otherFees: null,
  breakdowns: [
    {
      key: 'subtotal',
      name: 'Subtotal',
      value: {
        amountInMinor: 52800,
        amountDisplay:
          "\u003cfont color='#1c1c1c'\u003e₱528.00\u003c/font\u003e",
      },
      color: '#1c1c1c',
    },
    {
      key: 'delivery_fee',
      name: 'Delivery fee',
      value: {
        amountInMinor: 3500,
        amountDisplay: "\u003cfont color='#1c1c1c'\u003e35.00\u003c/font\u003e",
      },
      color: '#1c1c1c',
    },
  ],
  hydraIntimate: {
    sessionID:
      '66193308_1712814870716344066_c98253fd0064477da7a460c3675ad747_FOOD_WEB_UI_RS_EXTERNAL',
    serverTime: 1712814870,
    hydraHeadGroupID: ['f3c1b9f3-ef07-4bb5-a18f-b735f8ab2721', 'gj'],
  },
  errorDialog: null,
}

const fetch = fetch('https://food.grab.com/proxy/foodweb/v2/order/cart', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en',
    'content-type': 'application/json;charset=UTF-8',
    'sec-ch-ua': '"Brave";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'x-country-code': 'PH',
    'x-gfc-country': 'PH',
    'x-gfc-session':
      'bbc3fd9e36f6a8df3fea10e504ba2809a1f463602626ffef0fde3b4c175c4ab1',
    'x-grab-web-app-version': 'Y1WmgI5tFZaBXQ3cSYNJm',
    'x-hydra-jwt':
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnYWEiLCJhdWQiOiJnZnciLCJuYW1lIjoiZ3JhYnRheGkiLCJpYXQiOjE3MTI4MTQzOTksImV4cCI6MTcxMjgxNDk5OSwibmJmIjoxNzEyODE0Mzk5LCJ2ZXIiOiIxLjE5LjAuMjQiLCJicklEIjoiOGE5YTk4NjU0MzQ3MDlhNjJhYWU2YzI4ZjI5ZDg4ODIwMmJ5NnIiLCJzdXMiOnRydWUsImJySUR2MiI6IjMwOWVkYWNhMWEyMTM2MmYwMWI0OGUxMTY0YjVjOTI2NTk2eTZyIiwiYnJVSUQiOiI4ZTJjNWQzMi1lNTFiLTQyYzktODZiMC0wODE1YTk3OGEyMjkifQ.ljc_VPkaNJ_zpN7CUlKPAvoW5c7hi8qEd4IsGKdrpZUBz3DyYSmEpsnuxuInQ1EC92azEhUvHu96dyclbArcdxu-FkZej_npUv2BP5qO4Zhh7UP5wgV2LNcwv5Fkd5FElFeeSwSgOE6BmcXB70WRZLOXLwSruJ0IgCMHmBi8VzezyWcrNnSEoNOnIXfY0Qk8d3AIaJTHD-XtZxmxquAlzy7lju8yaK1kgBt9kZxfe7R3l5e8epfblSq2K85_ZmR4c_cbeiXed-mX_MrlNqW-92mbYNCJg9RUFreBULMMtK6u-54fFxzPVTNntqbb6LIuNm3__bcBlXvnBM3i-Gsf5A',
    cookie:
      'gfc_country=PH; _gsvid=9f22eeb7-a580-47c2-af77-4f9adf849634; hwuuid=8e2c5d32-e51b-42c9-86b0-0815a978a229; hwuuidtime=1709016296; gfc_session_guid=b64c71d2-fef8-4bed-83f0-79fc86c38f4b; next-i18next=en; _gssid=2403110523-eko31vjoig4; grabid-openid-authn-ck=eyJhbGciOiJSUzI1NiIsImtpZCI6Il9kZWZhdWx0IiwidHlwIjoiSldUIn0.eyJhbXIiOiJXRUJMT0dJTiIsImF1ZCI6IlNTT19UT0tFTl9JU1NVSU5HX1NFUlZJQ0UiLCJleHAiOjE3MTc5OTcwNzYsImlhdCI6MTcxMjgxMzA3MywianRpIjoiOWM5ODNmYzctODMxYy00YTQxLTgzZDAtZTc0MDdiOTg5MjRiIiwic3ViIjoiNjZjM2YxNTctNmYyOC00MjZjLTg1NzItZGIxYThmYTkwNDYxIiwic3ZjIjoiUEFTU0VOR0VSIn0.YoRO2TNCJq3DaqtyrWLnnsqGcETAd7yHmvCYxreQIAkrkbubnRj8aFlfNPSA5fVbzzkNWsO-6PXCeV0sH0pb5xqrkU_KlcVw-7PauOh5NG9m5YSEeISimInfXSryViGW1j7lnnoeV9LJfEz32RXag3Pq8V8NnKnIrL2aLwawWFiqpTVigLdw-xpd30E9WCI2RzBXqJWuPTdApubnkVwlaquqo3nzcne8ffl3bJUsvYRJLm4byYEXC5NZwhHcyDmoDqs4SoVoixV5CDe1tG3IHaXvo98t9SItMjbxp_bLWQ1HcGl2vPhKuvhR2sGMFV5mxffn4zeddwjWe1amu4suJw; gfc_session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJub25jZSI6IjZOTThKdE1PcnQ1NzI3ZksiLCJzdGF0ZSI6Imc5SHh0cEQiLCJjb2RlVmVyaWZpZXIiOiI1TlZ3QlBEODFyMFFVOUVoOU9QVVRlUDdPUE1sc0tPaENUMUFpdW9DQXpkWUFudkJndWJja3BNQXZ3MlAya2p3IiwiYWNjZXNzVG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWw5a1pXWmhkV3gwSWl3aWRIbHdJam9pU2xkVUluMC5leUpoZFdRaU9pSTBaR1JtTnpoaFpHVTRNekkwTkRZeU9UZzRabVZqTldKbVl6VTROelJqTWlJc0ltRjFkR2hmZEdsdFpTSTZNVGN4TWpneE16QTNNeXdpWlhod0lqb3hOekV5T0RRNU1EYzJMQ0pwWVhRaU9qRTNNVEk0TVRNd056WXNJbWx6Y3lJNkltaDBkSEJ6T2k4dmFXUndMbWR5WVdJdVkyOXRJaXdpYW5ScElqb2lhMHBFTW5jeFlYcFRVRXQ0U2xOMmIzbG1jRFl3VVNJc0ltNWlaaUk2TVRjeE1qZ3hNamc1Tml3aWNHbGtJam9pTlRWbFlqYzBOMkV0T1dOa1pTMDBZVEE1TFdFMk1tTXROVGN4TWpaa01HRTVZamRoSWl3aWMyTndJam9pVzF3aWIzQmxibWxrWENJc1hDSndjbTltYVd4bExuSmxZV1JjSWl4Y0lqazFNREkxWmprM1ltTmxNalJsWlRWaVpXSXpaakV4TnpobE9URmtZelJsWENJc1hDSmhaRGRpTkRnMlpXSTRaamcwTkRKaFltWTFPRFpsTUdRMFl6TmtaV1l3TUZ3aUxGd2lNREZpTUdOaU5qZzFNMkUwTkRWallUbGhaV1ptWWprNE9UVTVZbVZtTldaY0lsMGlMQ0p6ZFdJaU9pSTJVRzkwWVZVM1ZHVjVjVTl6YjBSdmRUaFJWbkZSTFhkeFJVUlVTVzVoVEc5TGFqbHpSMmhPYkZwcFpsRWlMQ0p6ZG1NaU9pSlFRVk5UUlU1SFJWSWlMQ0owYTE5MGVYQmxJam9pWVdOalpYTnpJbjAuU2lEeTFmaFdaWHlsc0gtOWtLWC1QdC1mTVlWbTBGQTJNVkZSWnIzUmp0cDZJTmNRalZyNFFFVWZNQXQ2LUIzOEdZVUd3Y0RqY0swQW1yVHZBdmh1MW5mdmJrMWRTX0k5MWFoeTNacklpLThqNF85WGNhd2JzTmY3blV5VkJCRUh5TFBJUGpjSUo1RDNKSGZzMHRyT3B0cVZfMVB0Sk1aX3BERTllMW1KdG9xalRRSEI0MlcwdnZIWm5WME5wU29Lc3RwLUd5YzFjSkM4YlV2TkR2NHNIcl90bDMzcjJUbHBubnNfWTV0Ujh1QmFqUks4cW8wYXUySnNLVEt5SV9Nbk8wSm9vZ3pmZ0pwMmlFWW9zb0dRZHpIdGFFRWdBS2hBWXoxQjFHMUtORFp5V1UxVGhwLWdJeVhwRTR6X2dGZnlYeDB1TExLbENNTWpGVENxaEVVU193Iiwic3VjY2Vzc1JlZGlyZWN0IjoiaHR0cHM6Ly9mb29kLmdyYWIuY29tL3BoL2VuL3Jlc3RhdXJhbnQvY2hvd2tpbmctcWEtd2VsY29tZS1yb3RvbmRhLWRlbGl2ZXJ5LzItQ1lNSE43REJBN0MyTlg_IiwiZmFpbHVyZVJlZGlyZWN0IjoiaHR0cHM6Ly9mb29kLmdyYWIuY29tL3BoL2VuL3Jlc3RhdXJhbnQvY2hvd2tpbmctcWEtd2VsY29tZS1yb3RvbmRhLWRlbGl2ZXJ5LzItQ1lNSE43REJBN0MyTlg_IiwibmFtZSI6IlJ5YW4gTWVyY3VyaW8iLCJzYWZlSWQiOiI2NmMzZjE1Ny02ZjI4LTQyNmMtODU3Mi1kYjFhOGZhOTA0NjEiLCJzZXNzaW9uS2V5IjoiYmJjM2ZkOWUzNmY2YThkZjNmZWExMGU1MDRiYTI4MDlhMWY0NjM2MDI2MjZmZmVmMGZkZTNiNGMxNzVjNGFiMSJ9.Y0_omHssYyikvQklQvKNCVt-WdupMRCeOCWQFw38RxE; pid=weblogin.grab.com; c=Internal; location=%7B%22id%22%3A%22IT.2GQI9G8L0OAG1%22%2C%22latitude%22%3A10.6688878%2C%22longitude%22%3A122.9463107%2C%22address%22%3A%22Gonzaga%20St%2C%20Brgy.%2036%2C%20Barangay%2021%20(Pob.)%2C%20Bacolod%20City%2C%20Negros%20Occidental%2C%206100%2C%20Western%20Visayas%20(Region%20VI)%2C%20Philippines%22%2C%22countryCode%22%3A%22PH%22%2C%22isAccurate%22%3Atrue%2C%22addressDetail%22%3A%22%22%2C%22noteToDriver%22%3A%22%22%2C%22city%22%3A%22Bacolod%20City%22%2C%22cityID%22%3A23%2C%22displayAddress%22%3A%22Gonzaga%20St%2C%20Brgy.%2036%2C%20Barangay%2021%20(Pob.)%2C%20Bacolod%20City%2C%20Negros%20Occidental%2C%206100%2C%20Western%20Visayas%20(Region%20VI)%2C%20Philippines%22%7D; hwToken=950ca0c42d51859c76d04dbe2b4a1067; hwTime=1712814399440',
    Referer: 'https://food.grab.com/ph/en/checkout',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  body: '{"merchants":[{"ID":"2-CY2XLNAFLAXELA","section":"PHSEC20210415024803015483","items":[{"ID":"PHITE20211031180154541816","quantity":1,"modifierGroups":[{"ID":"PHMOD20210415024835066375","modifiers":[{"ID":"PHMOD20230831162021040243","quantity":1}]},{"ID":"PHMOD20210415024834092862","modifiers":[{"ID":"PHMOD20230717114314235641","quantity":1}]}],"comment":""}]}],"paymentTypeID":"","promoCode":[],"comment":"","campaignIDs":[],"enterprise":null,"scheduledTime":null,"destination":{"longitude":122.9463107,"latitude":10.6688878,"address":"Gonzaga St, Brgy. 36, Barangay 21 (Pob.), Bacolod City, Negros Occidental, 6100, Western Visayas (Region VI), Philippines","keywords":"","meta":"","poiID":"IT.2GQI9G8L0OAG1"},"countryCode":"PH"}',
  method: 'POST',
})
