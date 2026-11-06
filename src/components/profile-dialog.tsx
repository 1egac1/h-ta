'use client';
import { useEffect,useRef,useState } from 'react';
import { X,FileText } from 'lucide-react';
import { motion,useReducedMotion } from 'framer-motion';
import type { CareerProfile } from '@/lib/recommendations';
export function ProfileDialog({profile,onClose,onSave}:{profile:CareerProfile|null;onClose:()=>void;onSave:(profile:CareerProfile)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const closingRef=useRef(false);
 const [closing,setClosing]=useState(false);
 const reduceMotion=useReducedMotion();
 const [draft,setDraft]=useState<CareerProfile>(profile??{name:'',role:'',skills:[],location:'',cvName:'',portfolioUrl:''});
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>{if(closeTimer.current)clearTimeout(closeTimer.current);element?.close()}},[]);
 const dismiss=(finish:()=>void)=>{if(closingRef.current)return;closingRef.current=true;setClosing(true);closeTimer.current=setTimeout(finish,reduceMotion?0:180)};
 return <motion.dialog ref={dialog} className={`profile-dialog ${closing?'is-closing':''}`} initial={{opacity:0,y:reduceMotion?0:10,scale:reduceMotion?1:.985}} animate={{opacity:closing?0:1,y:closing&&!reduceMotion?6:0,scale:closing&&!reduceMotion?.99:1}} transition={{duration:reduceMotion?0:.18,ease:'easeOut'}} onCancel={event=>{event.preventDefault();dismiss(onClose)}} onClick={event=>{if(event.target===event.currentTarget)dismiss(onClose)}}>
  <form onSubmit={event=>{event.preventDefault();dismiss(()=>onSave(draft))}}>
   <fieldset disabled={closing}>
   <div className="dialog-heading"><div><h2>{profile?'Your career profile':'Make it personal'}</h2><p>Create a local demo profile. No account or password required.</p></div><button type="button" aria-label="Close profile" onClick={()=>dismiss(onClose)}><X size={18}/></button></div>
   <label>Your name<input autoFocus required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Alex Morgan"/></label>
   <label>Professional role<input required value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})} placeholder="Frontend developer"/></label>
   <label>Skills<input required value={draft.skills.join(',')} onChange={e=>setDraft({...draft,skills:e.target.value.split(',')})} placeholder="React, TypeScript, accessibility"/></label>
   <label>Location or work preference<input value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="Europe, remote, or a city"/></label>
   <label className="profile-upload"><span><FileText size={15}/>{draft.cvName||'Attach your CV'}</span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>setDraft({...draft,cvName:e.target.files?.[0]?.name??''})}/></label>
   <label>Portfolio URL<input type="url" value={draft.portfolioUrl} onChange={e=>setDraft({...draft,portfolioUrl:e.target.value})} placeholder="https://your-portfolio.com"/></label>
   <p className="profile-privacy">Your profile stays in this browser. Files and links aren’t sent or analyzed; recommendations use the role and skills you enter.</p>
   <button type="submit" className="profile-submit">{profile?'Save profile':'Create demo profile'}</button>
   </fieldset>
  </form>
 </motion.dialog>;
}
