import { z } from './src'

const aschema = z.object({
  payment: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('Credit Card'),
      cardNumber: z.string().title('Credit Card Number').placeholder('1234 5678 9012 3456'),
      expirationDate: z.string().title('Expiration Date').placeholder('10/29'),
      brand: z.enum(['Visa', 'Mastercard', 'American Express']).default('Visa'),
    }),
    z.object({
      type: z.literal('PayPal'),
      email: z.string().email().title('Paypal Email').placeholder('john.doe@gmail.com'),
    }),
    z.object({
      type: z.literal('Bitcoin'),
      address: z.string().title('Bitcoin Address').placeholder('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
    }),
    z.object({
      type: z.literal('Bank Transfer'),
      accountNumber: z.string().title('Account Number').placeholder('1234567890'),
    }),
    z
      .object({
        type: z.literal('Cash'),
        amount: z
          .number()
          .title('Amount')
          .disabled((value) => (value || 0) > 100),
      })
      .disabled((obj) => {
        return {
          type: !!obj && obj.amount > 100,
        }
      })
      .disabled((obj) => {
        return false
      }),
  ]),
})
