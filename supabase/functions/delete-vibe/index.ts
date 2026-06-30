import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vibeId, nickname, pin } = await req.json()
    if (!vibeId || !nickname || !pin) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify pin
    const { data: userData, error: userError } = await supabase
      .from('registered_users')
      .select('pin_code')
      .ilike('nickname', nickname)
      .maybeSingle()

    if (userError || !userData || userData.pin_code !== pin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid PIN' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Expire vibe by setting expires_at to a past date
    const { error: deleteError, count } = await supabase
      .from('vibes')
      .update({ expires_at: new Date(0).toISOString() }, { count: 'exact' })
      .eq('id', vibeId)

    if (deleteError) {
      throw deleteError
    }

    if (count === 0) {
      return new Response(JSON.stringify({ error: 'Vibe not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
