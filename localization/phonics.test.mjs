import assert from 'node:assert/strict';
import {phonics} from './phonics-en.mjs';
const ids=new Set(), words=new Set();
for(const stage of phonics) for(const lesson of stage.lessons) {
  assert(!ids.has(lesson.id));ids.add(lesson.id);
  assert.equal(lesson.words.length,6);
  for(const parts of lesson.words) {
    const word=parts.join('');
    assert(!words.has(word),`Repeated word: ${word}`);words.add(word);
    assert(parts.every(p=>/^([a-z]|sh|ch|ck|ng)$/.test(p)),word);
    assert(parts.every(p=>!/[xq]/.test(p)),`Untaught multi-phoneme spelling: ${word}`);
    assert.equal(parts.filter(p=>/^[aeiou]$/.test(p)).length,1,word);
    if(stage.id==='easy') {
      assert.equal(parts.length,3);
      assert(parts.every(p=>p.length===1));
      assert.equal(parts[1],lesson.id.slice(-1));
      assert(!/[aeiou]/.test(parts[0]+parts[2]));
    } else if(stage.id==='medium') {
      assert.equal(parts.length,3);
      assert.equal(parts.filter(p=>p===lesson.id).length,1,word);
      assert.equal(parts.filter(p=>p.length===2).length,1,word);
    } else {
      assert.equal(parts.length,4);
      assert(parts.every(p=>p.length===1),`Consonant cluster incorrectly merged: ${word}`);
    }
  }
}
assert.equal(ids.size,14);assert.equal(words.size,84);
const all=phonics.flatMap(s=>s.lessons.flatMap(l=>l.words));
assert.deepEqual(all.find(p=>p.join('')==='ship'),['sh','i','p']);
assert.deepEqual(all.find(p=>p.join('')==='duck'),['d','u','ck']);
assert.deepEqual(all.find(p=>p.join('')==='sing'),['s','i','ng']);
assert.deepEqual(all.find(p=>p.join('')==='stop'),['s','t','o','p']);
console.log('PASS: 14 focused practices, 84 unique words, grapheme constraints and boundary cases');
