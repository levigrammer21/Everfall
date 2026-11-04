export const rarities = ['Common','Rare','Epic','Legendary','Mythic'] as const;
export const colors = ['#b9b9cd','#78cfff','#c598ff','#ffbb69','#ff759e'];
export const elements = {steel:0xfff3da,fire:0xff823c,ice:0x9beaff,storm:0x56c9ff,venom:0xa9ff4d,holy:0xffd776,void:0xdb76ff,life:0x53ffd0};
export type Element = keyof typeof elements;
export type Role = 'Guard'|'Striker'|'Caster'|'Support';
export type Effect = 'strike'|'burst'|'chain'|'burn'|'poison'|'bleed'|'freeze'|'fear'|'weaken'|'heal'|'shield'|'guard'|'summon'|'execute'|'haste'|'leech'|'reflect'|'blind'|'root'|'push'|'pull'|'mark'|'regen'|'revive'|'evade'|'cleanse'|'crit';
export type Skill = {name:string;effect:Effect;power:number;cool:number;trigger?:'kill'|'hurt'|'crit'|'low'|'cast'};
type Raw = [string,Role,Element,string,string,string,string,string,string];
const heroRows:Raw[] = [
['The Bone Man','Guard','void','Bone Storm:burst','Grave Pact:summon','Ossuary:shield','Bone Harvest:guard','Marrow Surge:heal','skeleton'],
['Death','Striker','void','Last Rites:execute','Crescent Reap:burst','Grave Brand:mark','Soul Tithe:haste','Cold Touch:leech','reaper'],
['Old Man Oak','Guard','life','Deep Roots:root','Sheltering Crown:shield','Spring Ring:heal','Old Growth:regen','Iron Bark:reflect','tree'],
['The Boogeyman','Striker','void','Under the Bed:fear','Night Bite:execute','Lights Out:blind','Feeds on Fear:crit','Slip Away:evade','reaper'],
['The Golden One','Guard','holy','Dawn Verdict:burst','Sun Mirror:reflect','Halo Ward:shield','Afterglow:heal','Radiant Oath:guard','knight'],
['The Rat King','Caster','venom','Royal Swarm:summon','Gutter Tide:poison','Crown Snatch:pull','Rat Feast:leech','Street Ambush:mark','rat'],
['Bigfoot','Guard','steel','Earth Stomp:push','Boulder Toss:burst','Bear Hug:root','Thick Hide:guard','Second Wind:regen','brute'],
['The Headless Horseman','Striker','fire','Midnight Charge:push','Head Toss:burn','Hoofstorm:burst','Dread Ride:fear','Ghost Saddle:evade','horse'],
['The Bog Witch','Caster','venom','Bog Brew:poison','Frog Call:summon','Swamp Hex:weaken','Bubbling Cauldron:burst','Mire Step:root','witch'],
['The Pumpkin King','Caster','fire','Lantern Bomb:burst','Harvest Crew:summon','Field Ablaze:burn','Seeds Scatter:mark','Hollow Grin:fear','pumpkin'],
['The Snowman','Guard','ice','Flash Freeze:freeze','Snowball Roll:push','Pack Snow:heal','Snowdrift:shield','Cold Shoulder:reflect','snow'],
['The Mad Scientist','Caster','storm','Tesla Rack:chain','Unstable Flask:burst','Clockwork Helper:summon','Overclock:haste','Static Discharge:mark','wizard'],
['The Dragon Lady','Striker','fire','Dragon Breath:burn','Wing Sweep:push','Scaleflare:shield','Furnace Blood:leech','Molten Claws:bleed','dragon'],
['The Puppet Master','Support','void','String Army:summon','Tug the Strings:pull','Take the Hit:shield','Stagecraft:evade','Final Bow:heal','witch'],
['The Butcher','Striker','steel','Carve:bleed','Chop Block:execute','Meat Hook:pull','Blood Scent:crit','Fresh Cut:leech','brute'],
['The Scarecrow','Caster','void','Empty Field:fear','Crowfall:chain','Straw Double:summon','Black Feather:blind','Patchwork:regen','pumpkin'],
['The Swamp Thing','Guard','venom','Toxic Vines:root','Slime Wave:poison','Marsh Mend:regen','Moss Armor:shield','Swamp Breath:weaken','tree'],
['The Plague Doctor','Support','venom','Spreading Fever:poison','Odd Medicine:heal','Clean Bill:cleanse','Bad Prognosis:weaken','Cure by Fire:burn','bird'],
['The Candle Man','Caster','fire','Wax Torrent:burn','Melt Armor:weaken','Wick Flare:chain','Hot Drip:reflect','Wax Seal:shield','candle'],
['The Grave Digger','Guard','steel','Grave Crew:summon','Shovel Swing:push','Dig In:guard','Loose Earth:blind','Six Feet Down:execute','knight'],
['The Jester','Striker','void','Punchline:crit','Trick Cards:chain','Smoke Trick:blind','Encore:haste','Juggling Knives:bleed','jester'],
['The Beekeeper','Support','venom','Hive Dance:summon','Honeycomb:shield','Angry Sting:poison','Royal Jelly:regen','Swarm Signal:mark','knight'],
['The Fisherman','Striker','ice','Hook Line:pull','Fish School:summon','Cold Current:freeze','Catch and Keep:leech','Net Cast:root','wizard'],
['The Black Knight','Guard','steel','Counterstance:reflect','Black Blade:bleed','Hold Ground:guard','Oath of Steel:shield','Fallen Standard:haste','knight'],
['The Mushroom Man','Support','venom','Spore Cloud:poison','Bloom Caps:summon','Mushroom Tea:heal','Bad Trip:fear','Spore Drift:blind','mushroom'],
['The Witch Doctor','Support','life','River Totem:summon','Spirit Aid:heal','Bad Omen:weaken','Smoke Wash:cleanse','Gift of Breath:regen','witch'],
['The Gargoyle','Guard','steel','Stone Skin:guard','Divebomb:burst','Granite Wings:reflect','Perch:shield','Wing Crack:push','dragon'],
['The Lumberjack','Striker','steel','Timber:burst','Notch Cut:bleed','Fell the Giant:execute','Work Rhythm:haste','Splinters:mark','brute'],
['The Undertaker','Guard','void','Coffin Trap:root','Last Nail:execute','Funeral Bell:weaken','Closed Casket:shield','Quiet Mourning:regen','reaper'],
['The Frog Prince','Striker','venom','Royal Leap:burst','Tongue Lash:pull','Toxic Kiss:poison','Pond Step:evade','Quick Croak:haste','frog'],
['The Old Hag','Caster','void','Crooked Curse:weaken','Evil Eye:blind','Hexfire:burn','Old Debt:leech','Bad Luck:mark','witch'],
['The Minotaur','Guard','steel','Maze Charge:push','Horn Sweep:burst','Lock Horns:guard','Red Mist:haste','Gore:bleed','brute'],
['The Toy Soldier','Guard','steel','Clockwork Wall:shield','Tiny Volley:chain','Bayonet:mark','Wind Up:haste','Tin Parade:guard','knight'],
['The Wolf Man','Striker','steel','Moon Bite:bleed','Wild Rush:haste','Howl:fear','Pack Hunger:leech','Crimson Moon:crit','rat'],
['The Mummy','Guard','holy','Bandage Snare:root','Tomb Renewal:regen','Sand Veil:blind','Linen Wrap:shield','Dry Curse:weaken','skeleton'],
['The Ghost','Caster','void','Phase Shift:evade','Spectral Touch:leech','Haunting:fear','Wall Slip:blind','Lost Soul:chain','ghost'],
['The Troll','Guard','venom','Club Smash:push','Troll Blood:regen','Bridge Toll:burst','Stone Bones:guard','Bruise:weaken','brute'],
['The Crow Man','Striker','void','Crow Mark:mark','Murder Flight:chain','Eye Peck:blind','Shiny Find:crit','Featherstep:evade','bird'],
['The Tin Man','Guard','storm','Steam Jet:burn','Rivet Plate:guard','Boiler Vent:burst','Oil Bath:regen','Conductive Hull:chain','knight'],
['Bones','Striker','steel','Rattle Slash:bleed','Loose Rib:chain','Bare Bones:haste','Rattle Faster:haste','Bone Stitch:shield','skeleton'],
['Slime','Guard','venom','Split: summon','Acid Bounce:poison','Gel Shell:shield','Sticky Floor:root','Rejoin:heal','slime'],
['Stumpy','Guard','life','Stump Roots:root','Bark Guard:shield','Sap Rise:regen','Wood Chips:reflect','New Shoot:heal','tree'],
['Sparky','Caster','storm','Chain Spark:chain','Blue Flash:blind','Static Pop:burst','Recharge:haste','Conduct:mark','spark'],
['Gramps','Caster','void','Purple Fireball:burn','Star Crash:burst','Walking Stick:push','Old Wisdom:crit','Afterburn:weaken','wizard'],
['Pickles','Caster','venom','Pickle Jar:poison','Jar Shatter:burst','Brine Trap:root','Bad Batch:weaken','Pocket Jar:burn','goblin'],
['Bubbles','Support','life','Bubble Mend:heal','Bubble Coat:shield','Clear Water:cleanse','Soft Landing:regen','Last Bubble:heal','slime'],
['Rusty','Guard','steel','Rusty Guard:guard','Iron Reply:reflect','Flake Burst:burst','Bad Scratch:bleed','Plate Up:shield','knight'],
['Nibbles','Striker','steel','Quick Nips:haste','Ankle Bite:bleed','Last Crumb:execute','Snack Time:leech','Scurry:evade','rat'],
['Dusty','Support','steel','Dust Storm:blind','Grit Cloud:weaken','Spinning Dust:chain','Dust Settles:evade','Eye Grit:mark','ghost'],
['Worm','Striker','venom','Burrow Ambush:burst','Earth Coil:root','Sinkhole:pull','Burrow Escape:evade','Deep Bite:bleed','worm']
];
const passiveTriggers = ['kill','hurt','crit','low','cast'] as const;
export const heroes = heroRows.map(([name,role,element,...row],id) => {
 const rarity = id<5?4:id<14?3:id<27?2:id<39?1:0;
 const mod = [1,1.02,1.04,1.07,1.1][rarity];
 const [hp,atk,armor,speed] = ({Guard:[155,16,16,1.45],Striker:[101,24,5,1.05],Caster:[86,26,3,1.4],Support:[106,17,8,1.48]})[role];
 const skills = row.slice(0,5).map((entry,i):Skill => {
  const [name,effect] = entry.split(':');
  return {name,effect:effect.trim() as Effect,power:i<3?1.04+(id%9)*.045+i*.16:.44+(id%7)*.045,cool:i<3?3.7+(id%6)*.36+i*2.35:4+(id%5)*.5,trigger:i>=3?(id===39&&i===3?'low':passiveTriggers[(id+i)%5]):undefined};
 });
 return {id,name,role,element,rarity,skills,shape:row[5],hp:Math.round(hp*mod+(id*5)%16),atk:atk*mod+(id*3)%7*.52,armor:armor*mod+id%4,speed:speed+(id%6)*.035,growth:.065+(id%8)*.004,hue:({39:43,43:283,44:104,45:171,46:22} as Record<number,number>)[id]??(id*49+28)%360};
});
const petRows: [string,Element,Effect,Effect,string][] = [
['Lucky Duck','holy','strike','mark','bird'],['Rocky','steel','shield','guard','rock'],['Angry Bee','venom','poison','crit','bee'],['Firefly','holy','mark','blind','bee'],['Pocket Spider','venom','root','poison','spider'],['Mud Puppy','life','heal','guard','rat'],['Little Bat','void','leech','bleed','bat'],['Snail','steel','guard','root','snail'],
['Frost Pup','ice','freeze','root','rat'],['Thunder Mouse','storm','chain','mark','rat'],['Little Ghost','void','weaken','evade','ghost'],['Baby Mimic','steel','execute','strike','chest'],['Poison Toad','venom','poison','burst','frog'],['Clockwork Bird','storm','haste','chain','bird'],['Shadow Cat','void','evade','crit','rat'],['Mushroom Buddy','life','heal','poison','mushroom'],
['Tiny Reaper','void','execute','mark','reaper'],['Ember Fox','fire','burn','burst','rat'],['Crystal Turtle','ice','shield','guard','snail'],['Storm Owl','storm','chain','mark','bird'],['Goblin Bomb','fire','burst','burn','goblin'],['Fairy Queen','life','heal','cleanse','bee'],['Void Worm','void','weaken','pull','worm'],
['Baby Dragon','fire','burn','burst','dragon'],['Golden Goose','holy','shield','mark','bird'],['Phoenix Chick','fire','burn','revive','bird'],['Nightmare','void','fear','leech','horse'],['Mini Golem','steel','shield','guard','rock'],['Little Death','void','execute','chain','reaper'],['Chaos Egg','storm','burst','cleanse','egg']
];
export const pets=petRows.map(([name,element,effect,link,shape],id)=>({id,name,element,effect,link,shape,rarity:id<8?0:id<16?1:id<23?2:id<28?3:4,power:.62+id%8*.055,cool:3.4+id%7*.35,hue:(id*71+18)%360}));
export const biomes = [
['Whispering Forest',0x575489,0xc4d0fd,'Briarheart'],['Ashen Highlands',0x833b44,0xff8e58,'Cinder Maw'],['Frostfall Expanse',0x406b9b,0xc5f5ff,'Ice Widow'],['Sunscorched Wastes',0x9b6248,0xffce80,'The Sun Eater'],['Rotwood Marsh',0x365947,0xbbdf81,'Mire Mother'],['Forgotten Catacombs',0x4b3d68,0xdfb9ff,'Ossuary King'],['Stormbreak Peaks',0x384888,0x82caff,'The Thunder Ram'],['Crimson Wastes',0x852e52,0xff8e99,'Blood Colossus'],['Shattered Kingdom',0x4e6178,0xf2d192,'The Broken Crown'],['Astral Abyss',0x5c3d93,0xe3aeff,'Star Devourer']
] as const;
const enemyRows = [
['Dire Hare','Briar Wolf','Hollow Doe','Bark Crawler','Night Moth','Feral Scout','Briar Wyrm','Black Stag','Twig Hexer','Root Sentinel'],
['Coal Hound','Charred Husk','Ash Imp','Lava Spark','Cinder Golem','Ash Raider','Soot Beetle','Coal Drake','Smoldered Giant','Kiln Keeper'],
['Frost Fox','Ice Revenant','Rime Imp','Snow Wisp','Glacier Golem','Tundra Raider','Ice Scarab','Frost Wyrm','White Yeti','Hail Sentinel'],
['Dune Jackal','Desert Mummy','Mirage Imp','Sun Wisp','Sand Construct','Dune Outlaw','Sandskitter','Sand Drake','Glass Beast','Obelisk Guard'],
['Mire Toad','Drowned Husk','Swamp Devil','Bog Light','Mud Golem','Marsh Thief','Giant Leech','Mire Drake','Rot Eater','Moss Warden'],
['Crypt Hound','Grave Walker','Bone Imp','Candle Wraith','Tomb Engine','Grave Robber','Tomb Spider','Bone Drake','Grave Giant','Crypt Guard'],
['Cliff Goat','Storm Husk','Thunder Imp','Cloud Wisp','Tempest Golem','Peak Marauder','Bolt Beetle','Storm Drake','Thunder Roc','Spire Watcher'],
['Blood Hound','Red Revenant','Crimson Imp','Ember Shade','Blood Engine','Red Knife','Blood Tick','Red Drake','Rift Butcher','Crimson Guard'],
['Court Lion','Dead Squire','Court Devil','Castle Spirit','Brass Knight','Castle Rogue','Wall Crawler','Crown Drake','Kingslayer','Royal Sentinel'],
['Star Wolf','Void Revenant','Rift Imp','Astral Spark','Star Construct','Rift Pirate','Void Crawler','Star Drake','Eclipse Beast','Gate Guardian']
];
const families=['Beast','Undead','Demon','Elemental','Construct','Bandit','Insect','Dragon','Corrupted','Guardian'];
const enemyShapes=['rat','skeleton','goblin','spark','rock','knight','spider','dragon','brute','knight'];
const enemyEffects:Effect[]=['bleed','leech','burn','chain','guard','blind','poison','push','fear','shield'];
const biomeElements:Element[]=['life','fire','ice','holy','venom','void','storm','fire','steel','void'];
export const enemies=enemyRows.flatMap((names,b)=>names.map((name,i)=>({id:b*10+i,name,family:families[i],shape:enemyShapes[i],element:biomeElements[b],effect:enemyEffects[i],hp:1+i*.095,atk:.85+i*.041,hue:(b*27+i*13+55)%360,biome:b})));
export const eliteMods=['Vampiric','Armored','Frenzied','Explosive','Regenerating','Shielded','Summoning','Elemental'] as const;
export const worldEvents=['Treasure Goblin','Wandering Merchant','Ancient Mimic','Corrupted Champion','Lost Caravan','Secret Shrine','Legendary Beast','Hidden World Boss'] as const;
export const guildJobs=['Training Grounds','Expeditions','Research Library','Forge','Infirmary','Scouting Office','Recruitment Hall','Guild Defense','Pet Sanctuary'] as const;
export const dungeons=[
 {name:'The Hollow Vault',detail:'The Vault Keeper shields itself and summons tomb guards.',boss:'Vault Keeper',biome:5,shape:'rock',effect:'shield',waves:4,level:1},
 {name:'Ember Reliquary',detail:'The Cinder Priest burns the party with sweeping flames.',boss:'Cinder Priest',biome:1,shape:'witch',effect:'burn',waves:5,level:8},
 {name:'The Rime Below',detail:'The White Maw freezes the front line and knocks heroes back.',boss:'White Maw',biome:2,shape:'dragon',effect:'freeze',waves:5,level:15},
 {name:'The Starless Gate',detail:'The Gate Eater spreads fear and calls creatures from the abyss.',boss:'Gate Eater',biome:9,shape:'reaper',effect:'fear',waves:6,level:25}
] as const;
export const bonds = ([
[0,1,'Grave Brothers','summon'],[6,10,'Snow Tracks','freeze'],[5,17,'Plague Rats','poison'],[44,11,'Unstable Mixture','burst'],[8,29,'Bog Royalty','root'],
[2,41,'Deep Roots','shield'],[3,35,'Midnight Company','fear'],[4,23,'Two Crowns','reflect'],[7,12,'Burning Charge','burn'],[9,15,'Harvest Night','summon'],
[13,32,'Strings and Springs','haste'],[14,33,'Blood Moon','bleed'],[16,24,'Marsh Bloom','regen'],[18,43,'Old Flame','burn'],[19,28,'Quiet Work','execute'],
[20,48,'Smoke and Mirrors','blind'],[21,45,'Honey Water','heal'],[22,49,'Hook and Worm','pull'],[25,17,'Field Medicine','cleanse'],[26,38,'Spire Watch','mark'],
[27,41,'Falling Timber','push'],[30,8,'Hex Circle','weaken'],[31,36,'Bridge Brawl','guard'],[34,28,'Wrapped Up','root'],[37,15,'Black Wings','chain'],
[38,42,'Live Wire','chain'],[39,0,'Loose Bones','summon'],[40,45,'Soft Bodies','heal'],[47,5,'Little Teeth','leech'],[40,29,'Pond Scum','poison']
] satisfies [number,number,string,Effect][]).map(([a,b,name,effect])=>({a,b,name,effect}));
export const starters=[39,44,43,46,45];
export const eggNames=['Wild Egg','Enchanted Egg','Ancient Egg'];
export const heroLore=[
 'Bones remember their owner. He remembers all of them.',
 'A patient reaper with a long list and a very short temper.',
 'An old tree who would rather shelter travelers than talk to them.',
 'It has lived under every bed you’ve ever owned.',
 'A wandering guardian whose armor catches light where there is none.',
 'Every rat in the kingdom pays him in secrets.',
 'Leaves large footprints, larger dents, and never signs his work.',
 'He lost his head once. The horse knows where he keeps the spare.',
 'Makes dinner and curses in the same pot.',
 'Enjoys harvest season. Objects to pie.',
 'A cheerful wall of snow with a stubborn streak.',
 'Labels every flask immediately after it explodes.',
 'Claims the fire is an unfortunate side effect of her good manners.',
 'Every puppet has a name. Nobody remembers the puppeteer’s.',
 'Sharpens both cleavers before breakfast.',
 'Has never successfully scared a crow away.',
 'Mostly moss, partly mud, and surprisingly hard to kill.',
 'Wears gloves because his patients keep turning green.',
 'Lights the road and melts anything that blocks it.',
 'Knows the locals underground and can call in favors.',
 'The punchline usually hurts.',
 'Asks the bees for advice and actually takes it.',
 'Has never admitted that a catch was too big.',
 'An old oath holds the armor together.',
 'His spores are medicinal in very small quantities.',
 'Drinks tea while his totems argue with ghosts.',
 'Pretends to be part of the building until the building is threatened.',
 'Thinks anything taller than him is a tree with poor manners.',
 'Always brings a spare coffin.',
 'Still insists that he was the prince before the curse.',
 'A small grudge can last her several centuries.',
 'Knows one reliable solution to a maze.',
 'Marched out of a toy chest and into a real war.',
 'Does his best work when there’s moonlight.',
 'Every bandage is older than the dungeon around it.',
 'Sometimes forgets that walls are supposed to stop people.',
 'Never collects a bridge toll from his own party.',
 'Will trade you a secret for something shiny.',
 'Runs on steam, stubbornness, and occasional repairs.',
 'A few ribs short, and faster for it.',
 'Two halves are occasionally more trouble than a whole.',
 'He was a tree once. He’s still putting down roots.',
 'Has no inside voice and very little electrical insulation.',
 'Misplaces his spectacles, remembers every spell.',
 'Each jar says homemade. None of them say safe.',
 'Takes care of everyone, then asks for a refill.',
 'The armor has been empty for years. The dents keep appearing.',
 'Small enough to miss until it bites.',
 'Has never lost a fight with a clean floor.',
 'Finds the shortest route through almost anything.'
];
