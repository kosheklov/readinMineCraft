// Authored reading units, not automatic translations or a generic hyphenator.
// French uses spoken syllables: silent final e stays with the preceding syllable.
// Age bands are inherited from the existing trainer, not validated proficiency levels.
const bank = (words) => words.split(' ').map(word => word.split('|'));
export const words = {
  en: {
    easy: bank('cat dog sun hat cup bed hen pig pen red bus fox box leg map bat bag jam net log rug lip top pot pet wet sit run hop six'),
    medium: bank('rab|bit kit|ten pup|py bas|ket pic|nic nap|kin muf|fin sun|set ro|bot ti|ger ze|bra pa|per mu|sic tu|lip cab|in wag|on lem|on mel|on sev|en com|et plan|et mag|net hel|met vel|vet in|sect den|tist fam|ily an|i|mal ba|na|na to|ma|to'),
    hard: bank('el|e|phant but|ter|fly la|dy|bug di|no|saur um|brel|la tel|e|phone bi|cy|cle pel|i|can oc|to|pus kan|ga|roo cat|er|pil|lar hel|i|cop|ter al|li|ga|tor av|o|ca|do mac|a|ro|ni wa|ter|mel|on cem|e|ter|y plan|e|tar|i|um li|brar|i|an mu|si|cian ad|ven|ture to|geth|er com|put|er to|mor|row af|ter|noon veg|e|ta|ble cel|e|brate dec|o|rate in|vi|ta|tion ex|plo|ra|tion')
  },
  es: {
    easy: bank('ca|sa me|sa so|pa ma|no lu|na cu|na ga|to pa|to lo|bo fo|ca va|ca mo|no ra|na ra|ta pe|ro pe|ra pi|no pe|lo te|la ta|za bo|ta bo|ca be|so da|do de|do la|na lo|ma li|ma ma|pa pi|pa'),
    medium: bank('pe|lo|ta ma|le|ta ca|mi|no ca|mi|sa co|mi|da mo|ne|da to|ma|te pa|lo|ma ba|na|na za|pa|to a|mi|go a|be|ja o|ve|ja es|cue|la es|tre|lla tor|tu|ga ca|ba|llo ven|ta|na man|za|na cu|cha|ra te|ne|dor ca|ra|col co|ne|jo ga|lli|na ce|re|za na|ran|ja plá|ta|no pá|ja|ro mú|si|ca sá|ba|do'),
    hard: bank('ma|ri|po|sa bi|ci|cle|ta e|le|fan|te co|co|dri|lo di|no|sau|rio cho|co|la|te ca|ra|me|lo ca|mi|se|ta za|pa|ti|lla te|lé|fo|no he|li|cóp|te|ro ri|no|ce|ron|te hi|po|pó|ta|mo bi|blio|te|ca a|ven|tu|ra u|ni|ver|so pri|ma|ve|ra na|tu|ra|le|za se|má|fo|ro bo|lí|gra|fo ca|len|da|rio or|de|na|dor com|pu|ta|do|ra as|tro|nau|ta te|les|co|pio la|bo|ra|to|rio i|ma|gi|na|ción fo|to|gra|fí|a a|be|ce|da|rio va|ca|cio|nes')
  },
  fr: {
    easy: bank('chat rat sac bol bus mur fil lit nid riz dos nez sel sol lac mer fer ver jus cou fou loup roue poule boule moule fée clé dé pré'),
    medium: bank('la|pin ma|tin sa|pin pa|tin jar|din cou|sin mou|lin ma|lin voi|sin che|min ba|teau cha|peau gâ|teau ca|deau ra|deau oi|seau mai|son rai|sin vé|lo sa|lon ci|tron co|chon mou|ton bou|ton car|ton pan|da ko|a|la che|val re|quin ca|nard'),
    hard: bank('cho|co|lat a|na|nas a|bri|cot a|ni|mal ca|ra|mel pa|ra|sol do|mi|no nu|mé|ro ca|mé|ra ci|né|ma py|ja|ma la|va|bo o|pé|ra kan|gou|rou pa|ra|pluie é|cu|reuil cham|pi|gnon é|lé|phant pé|li|can po|ti|ron ta|pi|o|ca cro|co|dile di|no|saure rhi|no|cé|ros hip|po|po|tame hé|li|cop|tère or|di|na|teur té|lé|vi|sion a|stro|naute é|du|ca|tion')
  }
};
