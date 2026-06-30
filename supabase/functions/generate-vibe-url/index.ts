import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filename, contentType } = await req.json()

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')
    // Fallback to media.anorachat.com if not configured
    const R2_PUBLIC_CUSTOM_DOMAIN = Deno.env.get('R2_PUBLIC_CUSTOM_DOMAIN') || 'media.anorachat.com'

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
      return new Response(JSON.stringify({ error: 'R2 credentials are not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    let endpoint = R2_ENDPOINT.replace(/\/$/, '')
    if (!endpoint.startsWith('http')) {
      endpoint = `https://${endpoint}`
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      // Cloudflare R2 requires path style to be false (uses virtual hosted) or handles it automatically depending on endpoint structure
      // But standard AWS SDK will automatically form the correct presigned URL for R2 if you just pass the endpoint
    })

    const uuid = crypto.randomUUID();
    const objectKey = `vibemedia/${uuid}-${filename}`
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType || 'application/octet-stream',
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    // Construct the public URL using the custom domain
    const publicUrl = R2_PUBLIC_CUSTOM_DOMAIN.startsWith('http')
      ? `${R2_PUBLIC_CUSTOM_DOMAIN}/${objectKey}`
      : `https://${R2_PUBLIC_CUSTOM_DOMAIN}/${objectKey}`

    return new Response(
      JSON.stringify({
        signedUrl: signedUrl,
        publicUrl: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
