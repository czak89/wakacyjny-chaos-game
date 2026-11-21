import type { AnimatorSkinId } from './types';

// 16-bit SNES/GBA-inspired pixel-art sprite atlas with hue-shifted 3-4 tone shading ramps.

const PALETTE: Record<string, string> = {
  '.': '',
  // Outlines & Neutrals (hue-shifted deep maritime ink)
  k: '#132030', // Primary deep navy outline
  K: '#263a52', // Soft inner outline / cool dark slate
  w: '#fffef9', // Crisp specular highlight
  W: '#e8eff5', // Shaded white / cream shadow
  m: '#cbd5e1', // Light feather grey
  M: '#7a8ea3', // Mid-dark feather grey
  z: '#475569', // Deep wing shadow

  // Skin ramp
  h: '#ffe7cc', // Skin highlight
  s: '#ffc999', // Skin base
  d: '#d99366', // Skin shadow

  // Rusałka Turquoise Polo ramp
  a: '#6ce5f0', // Turquoise specular highlight
  t: '#18a8bd', // Turquoise base
  T: '#0d728a', // Turquoise shadow
  A: '#084b61', // Deep teal crease

  // Sun Yellow / Gold ramp
  e: '#fff8b8', // Bright pale gold highlight
  y: '#f7d459', // Warm sun yellow
  Y: '#d99b26', // Rich amber / waffle shade
  u: '#9e6215', // Deep golden-brown crust

  // Coral / Red ramp
  i: '#ffa69e', // Coral highlight
  r: '#f25757', // Coral red base
  R: '#b82d38', // Crimson shadow

  // Flamingo Pink ramp
  f: '#ffb8df', // Pink vinyl glossy highlight
  p: '#ff66b2', // Flamingo pink base
  P: '#cf3482', // Flamingo shadow

  // Pine Forest Green ramp (hue-shifted toward yellow-green in light, blue-green in shade)
  L: '#8ce08a', // Sunlit pine tip highlight
  l: '#52b788', // Fresh pine green
  g: '#2d6a4f', // Mid Baltic pine
  G: '#1b4332', // Deep forest shadow
  E: '#112c24', // Pine under-canopy ink

  // Inflatable Croc Green ramp
  C: '#9bf58e', // Glossy croc highlight
  c: '#3ec767', // Bright croc green
  x: '#1f8a4c', // Croc shadow

  // Shorts / Denim / Unicorn Sky ramp
  B: '#60a5fa', // Light sky blue
  b: '#2563eb', // Royal shorts blue
  D: '#17388a', // Deep navy shadow
  v: '#c084fc', // Unicorn violet highlight
  V: '#7e22ce', // Unicorn violet shade

  // Wood & Waffle Hut ramp
  o: '#fb923c', // Orange beak / warm lantern
  O: '#c2591a', // Deep beak shadow
  j: '#cfa06b', // Light sunlit wood
  n: '#9c6638', // Mid wood plank
  N: '#613a1c', // Dark wood grain / bark
  q: '#dc2626', // Angry seagull eye red
  Z: '#d98a54', // Warm chestnut hair highlight
  H: '#9c4f24', // Warm chestnut hair base
  S: '#632c11', // Warm chestnut hair shadow
};

function bakeSprite(rows: string[], scale = 2): HTMLCanvasElement {
  const height = rows.length;
  const width = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

// 20x20 16-bit Animator (Sun cap with brim highlight, Rusałka turquoise polo, whistle, wooden net)
const ANIMATOR_WALK_A = [
  '.....kkkkkkk........',
  '....keeyyyyyk.......',
  '...keyyyyyyyYk......',
  '..kkYyyyyyyyykk.....',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkaaattTtttk..kkk.',
  '.kaatttwytTtttkkwWWk',
  '.kttttTttttTTkjkwwWk',
  '.kshkttTTttksnjkwWWk',
  '..kdkbBBBBbbkjk.kkk.',
  '...kbbBbbBbbk.......',
  '...kbbDkkDbbk.......',
  '...kbbD..Dbbk.......',
  '...kssd..dssk.......',
  '..kirrk..krrik......',
  '..kRRRk..kRRRk......',
  '..kkkkk..kkkkk......',
];

const ANIMATOR_WALK_B = [
  '.....kkkkkkk........',
  '....keeyyyyyk.......',
  '...keyyyyyyyYk......',
  '..kkYyyyyyyyykk.....',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkaaattTtttk...kkk',
  '.kaatttwytTtttk.kwWk',
  '.kttttTttttTTk.jkwWk',
  '.kshkttTTttksnjkWWwk',
  '..kdkbBBBBbbkjk.kkk.',
  '..kbbBbk.kbBbbk.....',
  '..kbbDDk.kDDbbk.....',
  '..kssd.....dssk.....',
  '.kirrk.....krrik....',
  '.kRRRk.....kRRRk....',
  '.kkkkk.....kkkkk....',
  '....................',
];

const ANIMATOR_DASH = [
  '......kkkkkkk.......',
  '.....keeyyyyyk......',
  '....keyyyyyyyYk.....',
  '...kkhhssssssdsk....',
  '...kshkskshkssdk....',
  '...kssssssssddsk....',
  '..kkaaattTttttkk....',
  '.kaatttwytTtttkkkkk.',
  '.kttttTttttTTjjwwWWk',
  '..kkbbBBBBbbknjwwwWk',
  '..kbbDDk.kbBDk.kWWwk',
  '.kirrRk...krRRk.kkk.',
  '.kkkkk.....kkkk.....',
  '....................',
];

// 20x20 16-bit Girl Animator (Chestnut ponytail + pink bow, Rusałka turquoise top, coral shorts)
const GIRL_WALK_A = [
  '....kkk..kkkkk......',
  '...kfpk.kZZHHHk.....',
  '..kfppkkZHHHHSSk....',
  '..kHkkZHHhhHHSSk....',
  '.kHSkkhhsssssHSk....',
  '.kSSkkshkskshksk....',
  '..kkk.kssissddsk....',
  '......kssirrdssk....',
  '..kkaaattTtttk..kkk.',
  '.kaatttwytTtttkkwWWk',
  '.kttttTttttTTkjkwwWk',
  '.kshkttTTttksnjkwWWk',
  '..kdkirrrrRRkjk.kkk.',
  '...krrrRRrrrk.......',
  '...krrRkkRrrk.......',
  '...kssd..dssk.......',
  '...kssd..dssk.......',
  '..kwwwk..kwwwk......',
  '..kTTTk..kTTTk......',
  '..kkkkk..kkkkk......',
];

const GIRL_WALK_B = [
  '....kkk..kkkkk......',
  '...kfpk.kZZHHHk.....',
  '..kfppkkZHHHHSSk....',
  '..kHkkZHHhhHHSSk....',
  '.kHSkkhhsssssHSk....',
  '.kSSkkshkskshksk....',
  '..kkk.kssissddsk....',
  '......kssirrdssk....',
  '..kkaaattTtttk...kkk',
  '.kaatttwytTtttk.kwWk',
  '.kttttTttttTTk.jkwWk',
  '.kshkttTTttksnjkWWwk',
  '..kdkirrrrRRkjk.kkk.',
  '..krrrRk.kRrrrk.....',
  '..krrRRk.kRRrrk.....',
  '..kssd.....dssk.....',
  '.kwwwk.....kwwwk....',
  '.kTTTk.....kTTTk....',
  '.kkkkk.....kkkkk....',
  '....................',
];

const GIRL_DASH = [
  '...kkk..kkkkk.......',
  '..kfpk.kZZHHHk......',
  '.kfppkkZHHHHSSk.....',
  '..kHSkhhsssssHSk....',
  '..kSSkshkskshksk....',
  '...kkkssssssddsk....',
  '..kkaaattTttttkk....',
  '.kaatttwytTtttkkkkk.',
  '.kttttTttttTTjjwwWWk',
  '..kkirrrrrRRknjwwwWk',
  '..krrRRk.krRRk.kWWwk',
  '.kwwwTk...kTwwk.kkk.',
  '.kkkkk.....kkkk.....',
  '....................',
];

// 20x20 16-bit WOPR Lifeguard (Surfer blond hair, cool shades, red lifeguard tank, yellow shorts)
const LIFEGUARD_WALK_A = [
  '.....kkkkkkkk.......',
  '....keeeyyyyyk......',
  '...keeyyyyyyYkk.....',
  '...khhssssssddk.....',
  '..kkBkKkkBkKsdk.....',
  '..kskkksskkksdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkiirrrrRrrk..kkk.',
  '.kshkrrwyrRrrkkkwWWk',
  '.kshkrrwyrRrrkjkwwWk',
  '.kshkrrRRrrksnjkwWWk',
  '..kdkyeeeeYYkjk.kkk.',
  '...kyyYyyYyyk.......',
  '...kyyYkkYyyk.......',
  '...kyyY..Yyyk.......',
  '...kssd..dssk.......',
  '..krrrk..krrrk......',
  '..kRRRk..kRRRk......',
  '..kkkkk..kkkkk......',
];

const LIFEGUARD_WALK_B = [
  '.....kkkkkkkk.......',
  '....keeeyyyyyk......',
  '...keeyyyyyyYkk.....',
  '...khhssssssddk.....',
  '..kkBkKkkBkKsdk.....',
  '..kskkksskkksdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkiirrrrRrrk...kkk',
  '.kshkrrwyrRrrkk.kwWk',
  '.kshkrrwyrRrrk.jkwWk',
  '.kshkrrRRrrksnjkWWwk',
  '..kdkyeeeeYYkjk.kkk.',
  '..kyyYYk.kYYyyk.....',
  '..kyyYYk.kYYyyk.....',
  '..kssd.....dssk.....',
  '.krrrk.....krrrk....',
  '.kRRRk.....kRRRk....',
  '.kkkkk.....kkkkk....',
  '....................',
];

const LIFEGUARD_DASH = [
  '......kkkkkkkk......',
  '.....keeeyyyyyk.....',
  '....keeyyyyyyYkk....',
  '...kkBkKkkBkKsdk....',
  '...kskkksskkksdk....',
  '...kssssssssddsk....',
  '..kkiirrrrRrrrkk....',
  '.kshkrrwyrRrrkkkkkk.',
  '.kshkrrRRrrRRjjwwWWk',
  '..kkyyeeeeYYknjwwwWk',
  '..kyyYYk.kyYYk.kWWwk',
  '.krrrRk...krRRk.kkk.',
  '.kkkkk.....kkkk.....',
  '....................',
];

// 20x20 16-bit Waffle Chef (Puffy white chef toque, white & gold apron, waffle-brown pants)
const CHEF_WALK_A = [
  '....kkk..kkk........',
  '...kwwwkkwwwk.......',
  '..kwwwwwwwwwWk......',
  '..kwwwWWWWWWmk......',
  '...kkWWWWWWkk.......',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '...kssirrrdssk......',
  '..kkttwwwwWWtk..kkk.',
  '.ktttkwyywwWWkkkwWWk',
  '.ktttkwwwwWWWkjkwwWk',
  '.kshkkwYYwWWknjkwWWk',
  '..kdkkwwwwWWkjk.kkk.',
  '...knnjnnjnnk.......',
  '...knnNkkNnnk.......',
  '...knnN..Nnnk.......',
  '...kssd..dssk.......',
  '..kYYYk..kYYYk......',
  '..kuuuk..kuuuk......',
  '..kkkkk..kkkkk......',
];

const CHEF_WALK_B = [
  '....kkk..kkk........',
  '...kwwwkkwwwk.......',
  '..kwwwwwwwwwWk......',
  '..kwwwWWWWWWmk......',
  '...kkWWWWWWkk.......',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '...kssirrrdssk......',
  '..kkttwwwwWWtk...kkk',
  '.ktttkwyywwWWkk.kwWk',
  '.ktttkwwwwWWWk.jkwWk',
  '.kshkkwYYwWWknjkWWwk',
  '..kdkkwwwwWWkjk.kkk.',
  '..knnjNk.kNjnnk.....',
  '..knnNNk.kNNnnk.....',
  '..kssd.....dssk.....',
  '.kYYYk.....kYYYk....',
  '.kuuuk.....kuuuk....',
  '.kkkkk.....kkkkk....',
  '....................',
];

const CHEF_DASH = [
  '.....kkk..kkk.......',
  '....kwwwkkwwwk......',
  '...kwwwwwwwwwWk.....',
  '...kkhhssssssdsk....',
  '...kshkskshkssdk....',
  '...kssssssssddsk....',
  '..kkttwwwwWWttkk....',
  '.ktttkwyywwWWkkkkkk.',
  '.ktttkwwwwWWWjjwwWWk',
  '..kknnjnnjnnknjwwwWk',
  '..knnNNk.knNNk.kWWwk',
  '.kYYYuk...kuYYk.kkk.',
  '.kkkkk.....kkkk.....',
  '....................',
];

// 20x20 16-bit Baltic Captain (White & navy captain cap with gold anchor, striped sailor sweater)
const CAPTAIN_WALK_A = [
  '....kkkkkkkkk.......',
  '...kwwwwywwwwk......',
  '...kwwWWyWWwwk......',
  '..kkDDDDDDDDDkk.....',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkwwwwwwwwWk..kkk.',
  '.kwwbbbbbbbbbkkkwWWk',
  '.kwwwwwwwwwwWkjkwwWk',
  '.kshkbbbbbbksnjkwWWk',
  '..kdkDDDDDDDkjk.kkk.',
  '...kDDKDDKDDk.......',
  '...kDDDkkDDDk.......',
  '...kDDD..DDDk.......',
  '...kssd..dssk.......',
  '..kKKKk..kKKKk......',
  '..kYYYk..kYYYk......',
  '..kkkkk..kkkkk......',
];

const CAPTAIN_WALK_B = [
  '....kkkkkkkkk.......',
  '...kwwwwywwwwk......',
  '...kwwWWyWWwwk......',
  '..kkDDDDDDDDDkk.....',
  '..kkhhssssssdsk.....',
  '..kshkskshkssdk.....',
  '..kssssssssddsk.....',
  '...kssirrrdssk......',
  '..kkwwwwwwwwWk...kkk',
  '.kwwbbbbbbbbbkk.kwWk',
  '.kwwwwwwwwwwWk.jkwWk',
  '.kshkbbbbbbksnjkWWwk',
  '..kdkDDDDDDDkjk.kkk.',
  '..kDDKDk.kDKDDk.....',
  '..kDDDDk.kDDDDk.....',
  '..kssd.....dssk.....',
  '.kKKKk.....kKKKk....',
  '.kYYYk.....kYYYk....',
  '.kkkkk.....kkkkk....',
  '....................',
];

const CAPTAIN_DASH = [
  '.....kkkkkkkkk......',
  '....kwwwwywwwwk.....',
  '...kkDDDDDDDDDkk....',
  '...kkhhssssssdsk....',
  '...kshkskshkssdk....',
  '...kssssssssddsk....',
  '..kkwwwwwwwwWWkk....',
  '.kwwbbbbbbbbbkkkkkk.',
  '.kwwwwwwwwwwwjjwwWWk',
  '..kkDDDDDDDDknjwwwWk',
  '..kDDDDk.kDDDk.kWWwk',
  '.kKKKYk...kYKKk.kkk.',
  '.kkkkk.....kkkk.....',
  '....................',
];

// 18x16 16-bit Glossy Pink Flamingo Inflatable
const FLAMINGO_SPRITE = [
  '.........kkkk.....',
  '........kfffpk....',
  '.......kfwkpppk...',
  '......kkyokppPk...',
  '......kkkk.kpPk...',
  '...........kpPk...',
  '...kkkkkkkkkpPk...',
  '..kfffpppppppppk..',
  '.kffwwppppPppppPk.',
  'kfppppppPPPpppppPk',
  'kppppppPPwPPppppPk',
  'kppPppppPPPppppPPk',
  '.kPPPpppppppppPPk.',
  '..kPPPPppppppPPk..',
  '...kkkkkkkkkkkk...',
  '..................',
];

// 18x16 16-bit Shaded Rainbow-Mane Turbo Unicorn Inflatable
const UNICORN_SPRITE = [
  '........kk........',
  '.......keek.......',
  '......keyyk.......',
  '.....kvvwwkk......',
  '....kvVwkBwwk.....',
  '....kvVwwwwWk.....',
  '.....kVwwwWWk.....',
  '..kkkvwwwwWWkk....',
  '.kviwwwwwwwwWWkk..',
  'kviVwwwwwwwwwwBWk.',
  'kVwwwwwwwWWwwwwWk.',
  'kWwwwwwwWWWWwwwWk.',
  '.kWWmmmmWWWWmmWWk.',
  '..kmmmmWWWWWWmmk..',
  '...kkkkkkkkkkkk...',
  '..................',
];

// 20x14 16-bit Glossy Beach Crocodile Inflatable
const CROC_SPRITE = [
  '....................',
  '.....kkkkkkkk.......',
  '...kkCCcccccckkk....',
  '..kCCcwkwccccccCkk..',
  '.kCccccccccccccccCk.',
  'kCccceeyycccceeyycck',
  'kccwwwwwwwwwwwwwwcck',
  'kccWWccWWccWWccWWcck',
  '.kxxxccccccccccxxxk.',
  '..kxxxxccccccxxxxk..',
  '...kkkkkkkkkkkkkk...',
  '....................',
];

// 16x14 16-bit Belgian Baltic Waffle with Layered Whipped Cream & Strawberry
const WAFFLE_SPRITE = [
  '......kkkk......',
  '.....kirrrk.....',
  '....kwwwwWWk....',
  '...kwwwwWWWWk...',
  '..kkwwwwWWWWkk..',
  '.kkeeYeeYeeYekk.',
  '.keYueYueYueYuk.',
  '.kYuuYuuYuuYuYk.',
  '.keYueYueYueYuk.',
  '.kYuuYuuYuuYuYk.',
  '.kkYYuYYuYYuYkk.',
  '..kkkkkkkkkkkk..',
];

// 16x14 16-bit Golden Healing Waffle with Sparkle & Berry
const GOLDEN_WAFFLE_SPRITE = [
  '......kkkk......',
  '.....kirrrk.....',
  '....keeeewwk....',
  '...keeeeewwwk...',
  '..kkeeeeewwwkk..',
  '.kkwwywwywwywkk.',
  '.kwyYwyYwyYwyYk.',
  '.kyYYyYYyYYyYYk.',
  '.kwyYwyYwyYwyYk.',
  '.kyYYyYYyYYyYYk.',
  '.kkYYYYYYYYYYkk.',
  '..kkkkkkkkkkkk..',
];

// 20x12 16-bit Feathered Baltic Seagull (Diver)
const SEAGULL_FLAP_UP = [
  '.kkk............kkk.',
  'kmmMk..........kMmmk',
  'kmwwMk...kkk..kMwwmk',
  '.kwwwMkkwwwwkkMwwwk.',
  '..kwwwWWwqkWWwwwwk..',
  '...kWWwwwwwwwwWWk...',
  '....kkWWwoooWWkk....',
  '......kkoOOk........',
  '........kkk.........',
];

const SEAGULL_FLAP_DOWN = [
  '........kkk.........',
  '......kkwwwkk.......',
  '.....kwwqkwWWk......',
  '...kkwwwwwwwWWkk....',
  '..kwwWWwooowWWwwk...',
  '.kmmMkwkoOOkwkMmmk..',
  'kMzzk..kk..kk..kzzMk',
  '.kkk............kkk.',
  '....................',
];

// 20x12 16-bit Angry Flanker Seagull (Slate Wingtips & Red Bandana/Beak)
const SEAGULL_FLANKER_UP = [
  '.kkk............kkk.',
  'kzzMk..........kMzzk',
  'kzmmMk...kkk..kMmmzk',
  '.kwwwMkkwwwwkkMwwwk.',
  '..kwwwWWqqkWWwwwwk..',
  '...kWWwwwwwwwwWWk...',
  '....kkWWroorWWkk....',
  '......kkrRRk........',
  '........kkk.........',
];

const SEAGULL_FLANKER_DOWN = [
  '........kkk.........',
  '......kkwwwkk.......',
  '.....kwwqqwWWk......',
  '...kkwwwwwwwWWkk....',
  '..kwwWWroorwWWwwk...',
  '.kzzMkwkrRRkwkMzzk..',
  'kMzk...kk..kk...kzMk',
  '.kkk............kkk.',
  '....................',
];

// 20x12 16-bit Boss Seagull "Królowa Frytek" with Shaded Gold Crown
const SEAGULL_QUEEN_UP = [
  '.......ke.ek........',
  '.kkk...keyek....kkk.',
  'kzzMk..kYYyk...kMzzk',
  'kzmwMkkwwqwwkkMwmzk.',
  '.kwwwWWwwwwWWwwwwk..',
  '..kkWWwoooooWWkk....',
  '....kkkkoOOokkk.....',
  '........kkkk........',
];

const SEAGULL_QUEEN_DOWN = [
  '.......ke.ek........',
  '.......keyek........',
  '......kkYYykk.......',
  '....kkwwqqqwwkk.....',
  '..kkwwWWwwwWWwwkk...',
  '.kzzMkwwoooowwkMzzk.',
  'kMzk..kkoOOokk..kzMk',
  '.kk.....kkkk.....kk.',
];

// 12x10 16-bit Crispy Fry Bomb Carton
const FRY_BOMB = [
  '....kkkk....',
  '...keeyyk...',
  '..keeyyYyk..',
  '..kiiiiirk..',
  '..kirrrRRk..',
  '..krrwwRRk..',
  '..krrrrRRk..',
  '...kRRRRk...',
  '....kkkk....',
];

// 20x22 16-bit Layered Baltic Pine Tree (4-shade foliage + textured bark)
const PINE_TREE = [
  '.........EE.........',
  '........ELLk........',
  '.......ELLllk.......',
  '......ELllgggk......',
  '.......EllggGk......',
  '.....EELLllggGk.....',
  '....ELLlllgggGGk....',
  '...ELllggggGGGGkk...',
  '....EllggGGGGGGk....',
  '...EELLllggggGGkk...',
  '..ELLlllggggGGGGkk..',
  '.ELllgggggGGGGGGGkk.',
  'EEllgggGGGGGGGGGGEEE',
  '.EEEGGGGGGGGGGGGGEE.',
  '.......kNjnNk.......',
  '.......kNjnNk.......',
  '.......kNnnNk.......',
  '.......kNNnNk.......',
  '......kNNNNNNk......',
  '......kkkkkkkk......',
];

// 18x10 16-bit Shaded Forest Berry Bush (Idle & Kid Peeking)
const PINE_BUSH_IDLE = [
  '.....EEEEEEEE.....',
  '...EELLllllggEE...',
  '..ELLlllgllgggEE..',
  '.ELllglggggggGGEE.',
  '.ElgggrgggggGGGGE.',
  'ElgggGGGGGGGGGGGGE',
  'EGGGGGGrGGGGGGGGGE',
  '.EGGGGGGGGGGGGGGE.',
  '..EEEEEEEEEEEEEE..',
];

const PINE_BUSH_PEEK = [
  '.....EEEEEEEE.....',
  '...EELLllllggEE...',
  '..ELLlkkkkkkggEE..',
  '.ELllkhssssdkGGEE.',
  '.ElggkskwskskGGGE.',
  'ElgggGkkkkkkGGGGGE',
  'EGGGGGGGGGGGGGGGGE',
  '.EGGGGGGGGGGGGGGE.',
  '..EEEEEEEEEEEEEE..',
];

// 16x14 16-bit Cheering Rescued Kid
const KID_HAPPY = [
  '....kkkkkk......',
  '...kiirrrrk.....',
  '..kkhhsssskk....',
  '..kshkskwsk.....',
  '..kssssssdk.....',
  '...kssrrdk......',
  '.kskeeeyyyksk...',
  '..kkyyyyyYkk....',
  '...kbbBBBbk.....',
  '...kbbD.Dbbk....',
  '...kssd.dssk....',
  '..kttk...kttk...',
  '..kkkk...kkkk...',
];

// 26x16 16-bit Wooden OW Rusałka Waffle Hut (Scalloped Striped Awning, Wood Planks, Glowing Counter)
const WAFFLE_HUT = [
  '..kkkkkkkkkkkkkkkkkkkkkk..',
  '.kiirwwiirwwiirwwiirwwiik.',
  'kirrrwwrrrwwrrrwwrrrwwrrrk',
  'kRRRRWWrrrWWrrrWWrrrWWrrRk',
  'kRkkRkkRkkRkkRkkRkkRkkRkkR',
  '.kNjnjnjnjnjnjnjnjnjnjnNk.',
  '.kNjnkkkaaaaaaaaaaaakknNk.',
  '.kNjnkatwwwwwwwwwwwwtanNk.',
  '.kNjnkatwweYewweYewwtanNk.',
  '.kNjnkatwYuuYwYuuYwwtanNk.',
  '.kNjnkkkkkkkkkkkkkkkkknNk.',
  '.kNjjnjjjnjjjnjjjnjjjnjNk.',
  '.kNnnnnnnnnnnnnnnnnnnnnNk.',
  '.kNNNNNNNNNNNNNNNNNNNNNNk.',
  '.kkkkkkkkkkkkkkkkkkkkkkkk.',
];

// Tiny 16-bit Beach Details (Starfish & Seashell)
const STARFISH_SPRITE = [
  '...kk...',
  '..kiik..',
  'kkirrik.',
  'krrrrRkk',
  '.krrRRk.',
  'krRkkRrk',
  'kk....kk',
];

const SHELL_SPRITE = [
  '..kkkk..',
  '.kwwwwk.',
  'kwWWwwWk',
  'kWwwWWwk',
  '.kkkkkk.',
];

export interface AnimatorSpriteSet {
  walkA: HTMLCanvasElement;
  walkB: HTMLCanvasElement;
  dash: HTMLCanvasElement;
}

export interface SpriteAtlas {
  animatorA: HTMLCanvasElement;
  animatorB: HTMLCanvasElement;
  animatorDash: HTMLCanvasElement;
  animatorSkins: Record<AnimatorSkinId, AnimatorSpriteSet>;
  flamingo: HTMLCanvasElement;
  unicorn: HTMLCanvasElement;
  croc: HTMLCanvasElement;
  waffle: HTMLCanvasElement;
  goldenWaffle: HTMLCanvasElement;
  seagullDiverUp: HTMLCanvasElement;
  seagullDiverDown: HTMLCanvasElement;
  seagullFlankerUp: HTMLCanvasElement;
  seagullFlankerDown: HTMLCanvasElement;
  seagullQueenUp: HTMLCanvasElement;
  seagullQueenDown: HTMLCanvasElement;
  fryBomb: HTMLCanvasElement;
  pineTree: HTMLCanvasElement;
  bushIdle: HTMLCanvasElement;
  bushPeek: HTMLCanvasElement;
  kidHappy: HTMLCanvasElement;
  waffleHut: HTMLCanvasElement;
  starfish: HTMLCanvasElement;
  shell: HTMLCanvasElement;
}

let cachedAtlas: SpriteAtlas | null = null;
const previewCache: Partial<Record<AnimatorSkinId, string>> = {};

export function getSpriteAtlas(): SpriteAtlas {
  if (cachedAtlas) return cachedAtlas;
  const boySet: AnimatorSpriteSet = {
    walkA: bakeSprite(ANIMATOR_WALK_A, 3),
    walkB: bakeSprite(ANIMATOR_WALK_B, 3),
    dash: bakeSprite(ANIMATOR_DASH, 3),
  };
  const girlSet: AnimatorSpriteSet = {
    walkA: bakeSprite(GIRL_WALK_A, 3),
    walkB: bakeSprite(GIRL_WALK_B, 3),
    dash: bakeSprite(GIRL_DASH, 3),
  };
  const lifeguardSet: AnimatorSpriteSet = {
    walkA: bakeSprite(LIFEGUARD_WALK_A, 3),
    walkB: bakeSprite(LIFEGUARD_WALK_B, 3),
    dash: bakeSprite(LIFEGUARD_DASH, 3),
  };
  const waffleChefSet: AnimatorSpriteSet = {
    walkA: bakeSprite(CHEF_WALK_A, 3),
    walkB: bakeSprite(CHEF_WALK_B, 3),
    dash: bakeSprite(CHEF_DASH, 3),
  };
  const captainSet: AnimatorSpriteSet = {
    walkA: bakeSprite(CAPTAIN_WALK_A, 3),
    walkB: bakeSprite(CAPTAIN_WALK_B, 3),
    dash: bakeSprite(CAPTAIN_DASH, 3),
  };

  cachedAtlas = {
    animatorA: boySet.walkA,
    animatorB: boySet.walkB,
    animatorDash: boySet.dash,
    animatorSkins: {
      boy: boySet,
      girl: girlSet,
      lifeguard: lifeguardSet,
      waffle_chef: waffleChefSet,
      captain: captainSet,
    },
    flamingo: bakeSprite(FLAMINGO_SPRITE, 3),
    unicorn: bakeSprite(UNICORN_SPRITE, 3),
    croc: bakeSprite(CROC_SPRITE, 3),
    waffle: bakeSprite(WAFFLE_SPRITE, 3),
    goldenWaffle: bakeSprite(GOLDEN_WAFFLE_SPRITE, 3),
    seagullDiverUp: bakeSprite(SEAGULL_FLAP_UP, 3),
    seagullDiverDown: bakeSprite(SEAGULL_FLAP_DOWN, 3),
    seagullFlankerUp: bakeSprite(SEAGULL_FLANKER_UP, 3),
    seagullFlankerDown: bakeSprite(SEAGULL_FLANKER_DOWN, 3),
    seagullQueenUp: bakeSprite(SEAGULL_QUEEN_UP, 3),
    seagullQueenDown: bakeSprite(SEAGULL_QUEEN_DOWN, 3),
    fryBomb: bakeSprite(FRY_BOMB, 3),
    pineTree: bakeSprite(PINE_TREE, 4),
    bushIdle: bakeSprite(PINE_BUSH_IDLE, 4),
    bushPeek: bakeSprite(PINE_BUSH_PEEK, 4),
    kidHappy: bakeSprite(KID_HAPPY, 3),
    waffleHut: bakeSprite(WAFFLE_HUT, 4),
    starfish: bakeSprite(STARFISH_SPRITE, 2),
    shell: bakeSprite(SHELL_SPRITE, 2),
  };
  return cachedAtlas;
}

export function getAnimatorSkinPreviewUrl(skinId: AnimatorSkinId): string {
  if (previewCache[skinId]) return previewCache[skinId]!;
  const atlas = getSpriteAtlas();
  const url = atlas.animatorSkins[skinId].walkA.toDataURL('image/png');
  previewCache[skinId] = url;
  return url;
}
