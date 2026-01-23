'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateLandingPage() {
    revalidatePath('/')
    revalidatePath('/(public)', 'layout')
}
