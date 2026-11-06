'use client';
import { useEffect,useRef,useState } from 'react';
import { X,FileText } from 'lucide-react';
import type { CareerProfile } from '@/lib/recommendations';
export function ProfileDialog({profile,onClose,onSave}:{profile:CareerProfile|null;onClose:()=>void;onSave:(profile:CareerProfile)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [draft,setDraft]=useState<CareerProfile>(profile??{name:'',role:'',skills:[],location:'',cvName:'',portfolioUrl:''});
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close()},[]);
 return <dialog ref={dialog} className="profile-dialog" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <form onSubmit={event=>{event.preventDefault();onSave(draft)}}>
   <div className="dialog-heading"><div><h2>{profile?'Your career profile':'Make it personal'}</h2><p>Create a local demo profile. No account or password required.</p></div><button type="button" aria-label="Close profile" onClick={onClose}><X size={18}/></button></div>
   <label>Your name<input autoFocus required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Alex Morgan"/></label>
   <label>Professional role<input required value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})} placeholder="Frontend developer"/></label>
   <label>Skills<input required value={draft.skills.join(',')} onChange={e=>setDraft({...draft,skills:e.target.value.split(',')})} placeholder="React, TypeScript, accessibility"/></label>
   <label>Location or work preference<input value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="Europe, remote, or a city"/></label>
   <label className="profile-upload"><span><FileText size={15}/>{draft.cvName||'Attach your CV'}</span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>setDraft({...draft,cvName:e.target.files?.[0]?.name??''})}/></label>
   <label>Portfolio URL<input type="url" value={draft.portfolioUrl} onChange={e=>setDraft({...draft,portfolioUrl:e.target.value})} placeholder="https://your-portfolio.com"/></label>
   <p className="profile-privacy">Your profile stays in this browser. Files and links aren’t sent or analyzed; recommendations use the role and skills you enter.</p>
   <button type="submit" className="profile-submit">{profile?'Save profile':'Create demo profile'}</button>
  </form>
 </dialog>;
}
