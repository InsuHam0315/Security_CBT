import 'fake-indexeddb/auto';
import { it,expect } from 'vitest';
import { readLesson,readChapter,getProfile,updateProfile } from '../src/storage';

it('장 전체 완료/해제가 이전 단원 기록과 다른 장·사용자 기록을 보존한다',async()=>{
 const owner='chapter-progress-fixture';
 await readLesson(owner,'SL02',true);await readLesson(owner,'SL04',true);
 await readLesson('other-chapter-fixture','SL01',true);
 await updateProfile(owner,p=>{p.textbookChecks=['kept'];});
 const before=await getProfile(owner), original=before.progress.find(p=>p.lessonId==='SL02')!;
 let p=await readChapter(owner,'A',true);
 expect(p.progress.filter(p=>p.completed&&['SL01','SL02','SL03'].includes(p.lessonId))).toHaveLength(3);
 expect(p.progress.find(p=>p.lessonId==='SL02')!.createdAt).toBe(original.createdAt);
 p=await readChapter(owner,'A',false);
 expect(p.progress.filter(x=>x.completed).map(x=>x.lessonId)).toEqual(['SL04']);
 expect(p.textbookChecks).toEqual(['kept']);
 expect((await getProfile('other-chapter-fixture')).progress[0].completed).toBe(true);
});
