import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Hello from send-daily-notification!")

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get users with push tokens
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, push_token, subscription_tier')
      .not('push_token', 'is', null)

    if (profileError) throw profileError
    
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No users with push tokens" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const messages = profiles.map(profile => {
      const isPremium = profile.subscription_tier === 'premium'
      
      return {
        to: profile.push_token,
        sound: 'default',
        title: isPremium ? '👑 GoalEdge Premium Picks!' : '⚽ Novos Picks do Dia!',
        body: isPremium 
          ? 'As análises premium de hoje já estão disponíveis. Acesse agora!'
          : 'Seus palpites gratuitos do dia chegaríam. Veja no app!',
        data: { screen: 'index' },
      }
    })

    // Send chunks to Expo push service
    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
    
    // Simplification for edge function: send all at once (ideal would be chunks of 100)
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const receipt = await response.json()

    return new Response(JSON.stringify({ success: true, receipt }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    })
  }
})
