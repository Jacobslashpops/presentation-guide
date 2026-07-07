// Airwallex Payment Integration
// This module provides the interface for Airwallex payment processing.
// Actual API keys and endpoints should be configured in environment variables.

const AIRWALLEX_BASE_URL = process.env.AIRWALLEX_API_URL || 'https://api-demo.airwallex.com'
const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID || ''
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY || ''

interface AirwallexBeneficiary {
  id: string
  name: string
  bank_country: string
  bank_details: {
    swift_code?: string
    account_number?: string
    bank_name?: string
    bank_address?: string
  }
  verification_status: 'pending' | 'verified' | 'rejected'
}

interface AirwallexTransfer {
  id: string
  beneficiary_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  reference?: string
  created_at: string
}

/**
 * Get an Airwallex auth token
 */
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: AIRWALLEX_CLIENT_ID,
      api_key: AIRWALLEX_API_KEY,
    }),
  })

  if (!response.ok) {
    throw new Error('Airwallex authentication failed')
  }

  const data = await response.json()
  return data.token
}

/**
 * Create a beneficiary in Airwallex
 * Maps to our bank_accounts table
 */
export async function createAirwallexBeneficiary(bankAccount: {
  id: string
  account_name: string
  bank_name: string | null
  country: string
  swift_bic: string | null
}): Promise<AirwallexBeneficiary | null> {
  if (!AIRWALLEX_CLIENT_ID || !AIRWALLEX_API_KEY) {
    console.log('[Airwallex] API credentials not configured, skipping beneficiary creation')
    return null
  }

  try {
    const token = await getAuthToken()

    const response = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/transfers/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-request-id': `create-beneficiary-${bankAccount.id}`,
      },
      body: JSON.stringify({
        name: bankAccount.account_name,
        bank_country: bankAccount.country,
        bank_details: {
          swift_code: bankAccount.swift_bic || undefined,
          bank_name: bankAccount.bank_name || undefined,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Airwallex beneficiary creation failed: ${error.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Airwallex] Beneficiary creation error:', error)
    return null
  }
}

/**
 * Create a payout transfer in Airwallex
 * Maps to our payments table
 */
export async function createAirwallexTransfer(payment: {
  id: string
  beneficiary_id: string
  amount: number
  currency: string
  reference?: string
}): Promise<AirwallexTransfer | null> {
  if (!AIRWALLEX_CLIENT_ID || !AIRWALLEX_API_KEY) {
    console.log('[Airwallex] API credentials not configured, skipping transfer creation')
    return null
  }

  try {
    const token = await getAuthToken()

    const response = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/transfers/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-request-id': `transfer-${payment.id}`,
      },
      body: JSON.stringify({
        beneficiary_id: payment.beneficiary_id,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference || `Payment ${payment.id.slice(0, 8)}`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Airwallex transfer failed: ${error.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Airwallex] Transfer error:', error)
    return null
  }
}

/**
 * Query transfer status from Airwallex
 */
export async function getAirwallexTransferStatus(transferId: string): Promise<AirwallexTransfer | null> {
  if (!AIRWALLEX_CLIENT_ID || !AIRWALLEX_API_KEY) {
    return null
  }

  try {
    const token = await getAuthToken()

    const response = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/transfers/${transferId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
