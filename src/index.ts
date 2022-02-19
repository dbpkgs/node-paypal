import axios from 'axios'

type AuthProps = {
  username: string
  password: string
}

type PaypalEnvironment = 'LIVE' | 'SANDBOX'

type Currencies =
  | 'USD'
  | 'NZD'
  | 'NOK'
  | 'PHP'
  | 'PLN'
  | 'GBP'
  | 'RUB'
  | 'SGD'
  | 'SEK'
  | 'CHF'
  | 'THB'
  | 'CZK'
  | 'DKK'
  | 'EUR'
  | 'HKD'
  | 'HUF'
  | 'ILS'
  | 'JPY'
  | 'MYR'
  | 'MXN'
  | 'TWD'
  | 'AUD'
  | 'BRL'
  | 'CAD'
  | 'CNY'

type TransactionConfig = {
  PAYPAL_ENVIRONMENT: PaypalEnvironment
  PAYPAL_CLIENT_ID: string
  PAYPAL_SECRET_ID: string
}

type CreateTokenOptions = TransactionConfig

type TransactionOptions = {
  amount: number
  payment_description: string
  return_url?: string
  cancel_url?: string
  currency?: Currencies
}

type TransactionData = {
  intent: 'sale'
  payer: {
    payment_method: 'paypal'
  }
  transactions: {
    amount: {
      total: number
      currency: Currencies
    }
    description: string
  }[]
  redirect_urls: {
    return_url: string
    cancel_url: string
  }
}

type CreateTokenResponse = {
  access_token: string
}

type CreateTransactionResponse = {
  orderId?: string
}

module Paypal {
  const getUrl = (env: PaypalEnvironment): string => {
    return env === 'LIVE'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'
  }

  export const createToken = async (
    options: CreateTokenOptions
  ): Promise<CreateTokenResponse> => {
    try {
      const PAYPAL_API = getUrl(options.PAYPAL_ENVIRONMENT)
      const url: string = `${PAYPAL_API}/v1/oauth2/token`

      const auth: AuthProps = {
        username: options.PAYPAL_CLIENT_ID,
        password: options.PAYPAL_SECRET_ID
      }

      const response = await axios({
        method: 'post',
        url,
        data: 'grant_type=client_credentials', // => this is mandatory x-www-form-urlencoded. DO NOT USE json format for this
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded', // => needed to handle data parameter
          'Accept-Language': 'en_US',
          'Access-Control-Allow-Origin': '*'
        },
        auth
      })

      return {
        access_token: response.data.access_token
      }
    } catch (err: any) {
      throw Error(err)
    }
  }

  export const createTransaction = async (
    transaction: TransactionOptions,
    configs: TransactionConfig
  ): Promise<CreateTransactionResponse> => {
    try {
      const PAYPAL_API: string = getUrl(configs.PAYPAL_ENVIRONMENT)
      const url: string = `${PAYPAL_API}/v1/payments/payment`

      const token = await createToken(configs)

      const data: TransactionData = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        transactions: [
          {
            amount: {
              total: transaction.amount,
              currency: transaction.currency ?? 'USD'
            },
            description: transaction.payment_description
          }
        ],
        redirect_urls: {
          return_url: transaction.return_url ?? 'https://example.com',
          cancel_url: transaction.cancel_url ?? 'https://example.com'
        }
      }

      const response = await axios.post(url, data, {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      })

      let orderId: undefined | string

      for (let link of response.data.links) {
        if (link.rel === 'approval_url') {
          orderId = link.href.match(/EC-\w+/)[0]
        }
      }

      return { orderId }
    } catch (err: any) {
      throw Error(err)
    }
  }
}

const paypal = Paypal
export default paypal
