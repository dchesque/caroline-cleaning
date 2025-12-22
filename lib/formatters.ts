
/**
 * Formata telefone para padrão americano (XXX) XXX-XXXX
 */
export function formatPhoneUS(value: string): string {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Limita a 10 dígitos
    const limited = numbers.slice(0, 10)

    // Formata progressivamente
    if (limited.length === 0) return ''
    if (limited.length <= 3) return `(${limited}`
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Remove formatação do telefone, mantendo só números
 */
export function unformatPhone(value: string): string {
    return value.replace(/\D/g, '')
}

/**
 * Valida telefone americano (10 dígitos)
 */
export function isValidPhoneUS(value: string): boolean {
    const numbers = value.replace(/\D/g, '')
    return numbers.length === 10
}

/**
 * Valida email
 */
export function isValidEmail(value: string): boolean {
    if (!value) return true // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
}

/**
 * Formata valor para moeda USD
 */
export function formatCurrencyUSD(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num)
}

/**
 * Formata input de moeda (permite apenas números e ponto)
 */
export function formatCurrencyInput(value: string): string {
    // Remove tudo exceto números e ponto
    let cleaned = value.replace(/[^0-9.]/g, '')

    // Garante apenas um ponto decimal
    const parts = cleaned.split('.')
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('')
    }

    // Limita a 2 casas decimais
    if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 2)
    }

    return cleaned
}

/**
 * Converte string de moeda para número
 */
export function parseCurrency(value: string): number {
    const cleaned = value.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
}

/**
 * Formata ZIP Code americano (5 dígitos)
 */
export function formatZipCode(value: string): string {
    return value.replace(/\D/g, '').slice(0, 5)
}

/**
 * Valida ZIP Code americano
 */
export function isValidZipCode(value: string): boolean {
    const numbers = value.replace(/\D/g, '')
    return numbers.length === 5
}

/**
 * Formata estado para maiúsculo (2 letras)
 */
export function formatState(value: string): string {
    return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
}

/**
 * Lista de estados americanos
 */
export const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
]
