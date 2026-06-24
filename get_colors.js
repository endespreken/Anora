const Vibrant = require('node-vibrant');

const url = 'https://snixuzaslqdnbduqmazs.supabase.co/storage/v1/object/public/Asset/Logo%20Apps%20Mobile.png';

Vibrant.from(url).getPalette()
  .then((palette) => {
    console.log('Vibrant:', palette.Vibrant.hex);
    console.log('Muted:', palette.Muted.hex);
    console.log('DarkVibrant:', palette.DarkVibrant.hex);
    console.log('DarkMuted:', palette.DarkMuted.hex);
    console.log('LightVibrant:', palette.LightVibrant.hex);
    console.log('LightMuted:', palette.LightMuted.hex);
  })
  .catch((err) => {
    console.error(err);
  });
