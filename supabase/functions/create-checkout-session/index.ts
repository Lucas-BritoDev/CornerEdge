import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Hello from create-checkout-session!")

Deno.serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
      'Access-Control-Allow-Headers': 'apikey,X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization',
    }})
  }

  try {
    const { userId, email } = await req.json()
    
    if (!userId) throw new Error('userId is required')

    // Here you would integrate with Stripe:
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
    // const session = await stripe.checkout.sessions.create({...})
    
    // For now, we mock the success response URL for demonstration
    const mockUrl = "https://checkout.stripe.com/pay/cs_test_mock123?userId=" + userId

    return new Response(JSON.stringify({ url: mockUrl }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400
    })
  }
})
