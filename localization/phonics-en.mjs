// Supplementary practice for already-taught correspondences, not a phonics course.
// Each entry is one grapheme per phoneme in these specific regular words.
// Adjacent consonants stay separate; sh/ch/ck/ng remain intact.
const lesson = (id, label, focus, tip, sequence) => {
  const words = sequence.split(' ').map(s => s.split('|'));
  return {id, label, focus, tip, words,
    prerequisite: [...new Set(words.flat())].join(' · ')};
};
export const phonics = [
  {id:'easy', label:'Short vowels', short:'Short vowels', lessons:[
    lesson('short-a','Short a · sat, map','Short a', 'Use the short a sound in sat. Say each sound, then blend from left to right.', 's|a|t m|a|t m|a|p t|a|p p|a|t p|a|n'),
    lesson('short-i','Short i · sit, pin','Short i', 'Use the short i sound in sit. Keep the vowel short as you blend.', 's|i|t p|i|t p|i|n t|i|n n|i|p d|i|p'),
    lesson('short-o','Short o · pot, mop','Short o', 'Use the short o sound in pot in your accent. These words use the same vowel pattern.', 'p|o|t d|o|t n|o|d t|o|p m|o|p p|o|p'),
    lesson('short-u','Short u · sun, mud','Short u', 'Use the short u sound in sun. Say the sounds, not the letter names.', 's|u|n s|u|m m|u|d n|u|t t|u|b b|u|n'),
    lesson('short-e','Short e · pen, bed','Short e', 'Use the short e sound in pen. Blend all three sounds into one word.', 'p|e|n p|e|t n|e|t t|e|n b|e|d r|e|d')
  ]},
  {id:'medium', label:'Two letters, one sound', short:'Two letters', lessons:[
    lesson('sh','sh · ship, fish','sh: two letters, one sound', 'Keep sh together: it spells one sound. A line marks the two-letter spelling.', 'sh|i|p sh|o|p sh|u|t sh|e|d f|i|sh d|i|sh'),
    lesson('ch','ch · chip, much','ch: two letters, one sound', 'Keep ch together, as in chip. Do not say separate c and h sounds.', 'ch|i|p ch|o|p ch|i|n ch|a|t m|u|ch r|i|ch'),
    lesson('ck','ck · pack, duck','ck: two letters, one sound', 'At the end of these words, ck spells one k sound. Say it only once.', 'p|a|ck s|a|ck b|a|ck n|e|ck p|e|ck d|u|ck'),
    lesson('ng','ng · sing, hung','ng: two letters, one sound', 'Keep ng together, as at the end of sing. Do not add a separate g sound.', 's|i|ng r|i|ng k|i|ng w|i|ng s|a|ng h|u|ng')
  ]},
  {id:'hard', label:'Adjacent consonants', short:'More sounds', lessons:[
    lesson('final-n','Final consonants · tent, hand','Hear every final sound', 'Keep the final consonants separate: in tent, n and t each spell a sound.', 't|e|n|t b|e|n|t s|e|n|t d|e|n|t m|e|n|d h|a|n|d'),
    lesson('initial-s','Starting with s · stop, spin','Hear every starting sound', 'In stop, s and t are two sounds, not one. Blend all four sounds.', 's|t|o|p s|t|e|p s|t|e|m s|p|i|n s|p|o|t s|p|i|t'),
    lesson('initial-l','Starting with l blends · plan, slip','Keep both starting sounds', 'In plan, p and l each spell a sound. Say each one before blending the word.', 'p|l|a|n c|l|a|p f|l|a|t s|l|i|p s|l|a|m p|l|u|m'),
    lesson('initial-r','Starting with r blends · crab, drum','Keep both starting sounds', 'In crab, c and r each spell a sound. Keep both as you blend the word.', 'c|r|a|b d|r|u|m t|r|i|p g|r|i|n g|r|a|b f|r|o|g'),
    lesson('final-st','Ending in st · nest, list','Keep both ending sounds', 'At the end of nest, s and t each spell a sound. Do not miss the last sound.', 'b|e|s|t n|e|s|t r|e|s|t t|e|s|t l|i|s|t m|i|s|t')
  ]}
];
