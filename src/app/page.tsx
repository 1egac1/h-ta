'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, BriefcaseBusiness, Check, ChevronRight, Copy, FileText, Sparkles, X, Bookmark, BookmarkCheck, ExternalLink, Clock3 } from 'lucide-react';
import { ChatMenu } from '@/components/chat-menu';
import { opportunities, Opportunity } from '@/lib/opportunities';
import { ProfileDialog } from '@/components/profile-dialog';
import { careerContext, recommend, type CareerProfile, type CareerContext } from '@/lib/recommendations';
import { createChat, freshSession, readSession, SESSION_KEY, uid, welcome, type Message, type Chat } from '@/lib/session';
export default function Home(){
 const reduceMotion=useReducedMotion();
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const [chats,setChats]=useState<Chat[]>([{id:'welcome',title:'New conversation',messages:[{id:'welcome',role:'assistant',text:welcome}]}]);
 const [active,setActive]=useState('welcome'),[input,setInput]=useState(''),[pending,setPending]=useState<string[]>([]),[light,setLight]=useState(false),[saved,setSaved]=useState<string[]>([]),[expanded,setExpanded]=useState<string|null>(null),[attachments,setAttachments]=useState<string[]>([]),[copied,setCopied]=useState(false);
 const [viewed,setViewed]=useState<string[]>([]);
 const [profile,setProfile]=useState<CareerProfile|null>(null),[profileOpen,setProfileOpen]=useState(false),[ready,setReady]=useState(false);
 const timers=useRef(new Map<string,ReturnType<typeof setTimeout>>());
 const sidebarBeforeProfile=useRef(false);
 const end=useRef<HTMLDivElement>(null),fileRef=useRef<HTMLInputElement>(null),textarea=useRef<HTMLTextAreaElement>(null);
 const chat=chats.find(c=>c.id===active)??chats[0];
 const typing=pending.includes(active);
 const isNewConversation=chat.title==='New conversation'&&chat.messages.length===1;
 const hasConversation=chats.some(c=>c.title!=='New conversation'||c.messages.some(m=>m.role==='user'));
 const context=careerContext(chats.filter(c=>!c.conversationType||c.conversationType==='assistant').flatMap(c=>c.messages),profile);
 useEffect(()=>{setSidebarOpen(hasConversation)},[hasConversation]);
 useEffect(()=>{
  try{const session=readSession(localStorage);setChats(session.chats);setActive(session.active);setSaved(session.saved);setViewed(session.viewed??[]);setProfile(session.profile);setLight(localStorage.getItem('morrow-theme')==='light')}catch{}
  setReady(true);
 },[]);
 useEffect(()=>{if(ready){try{localStorage.setItem(SESSION_KEY,JSON.stringify({chats,active,saved,profile,viewed}));localStorage.setItem('morrow-theme',light?'light':'dark')}catch{}}},[ready,chats,active,saved,profile,viewed,light]);
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);timers.current.clear()},[]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'})},[chat?.messages,typing,reduceMotion]);
 const resetComposer=()=>{setInput('');setAttachments([]);setExpanded(null);if(textarea.current)textarea.current.style.height='auto'};
 const send=(text=input)=>{
  const value=text.trim();if(!ready||timers.current.has(active)||(!value&&!attachments.length))return;
  const target=active,user:Message={id:uid(),role:'user',text:value+(attachments.length?`\n📎 ${attachments.join(', ')}`:'')};
  const hadFiles=attachments.length>0,history=chat.messages;
  const userContext=careerContext([...chats.filter(c=>!c.conversationType||c.conversationType==='assistant').flatMap(c=>c.messages),user],profile);
  setChats(cs=>cs.map(c=>c.id===target?{...c,title:c.title==='New conversation'?value.slice(0,34)||'Profile analysis':c.title,messages:[...c.messages,user]}:c));
  resetComposer();setPending(ids=>[...ids,target]);
  const timer=setTimeout(()=>{
   timers.current.delete(target);
   const reply=chat.conversationType==='client'||chat.conversationType==='recruiter'?{text:'This is a simulated reply. Your message stays in this browser and was not delivered.'}:respond(value,history,hadFiles,userContext,saved,viewed);
   setChats(cs=>cs.map(c=>c.id===target?{...c,messages:[...c.messages,{id:uid(),role:'assistant',...reply}]}:c));
   setPending(ids=>ids.filter(id=>id!==target));
  },900);
  timers.current.set(target,timer);
 };
 const newChat=()=>{const c=createChat();setChats(cs=>[c,...cs]);setActive(c.id);resetComposer();textarea.current?.focus()};
 const selectChat=(id:string)=>{setActive(id);resetComposer()};
 const deleteChat=(id:string)=>{
  const target=chats.find(c=>c.id===id);if(!target||!window.confirm(`Delete “${target.title}”? This conversation will be removed from this browser.`))return;
  clearTimeout(timers.current.get(id));timers.current.delete(id);setPending(ids=>ids.filter(value=>value!==id));
  const remaining=chats.filter(c=>c.id!==id),next=remaining.length?remaining:[createChat()];
  setChats(next);if(active===id){setActive(next[0].id);resetComposer()}
 };
 const clearSession=()=>{
  if(!window.confirm('Clear this session? All conversations, saved opportunities, and your demo profile will be removed from this browser.'))return;
  timers.current.forEach(clearTimeout);timers.current.clear();setPending([]);
  const session=freshSession();setChats(session.chats);setActive(session.active);setSaved([]);setViewed([]);setProfile(null);setSidebarOpen(false);resetComposer();
  try{localStorage.setItem(SESSION_KEY,JSON.stringify(session))}catch{}
 };
 const discover=(kind:Opportunity['kind'])=>{
  const result=recommend(kind,context,viewed);
  const c:Chat={id:uid(),title:`${result.personalized?'Recommended':'Popular'} ${kind==='job'?'jobs':'freelance projects'}`,messages:[{id:uid(),role:'assistant',text:result.text,items:result.items,discovery:{kind,personalized:result.personalized,reasons:result.reasons}}]};
  setChats(cs=>[c,...cs]);setActive(c.id);resetComposer();
 };
 const startApplication=(item:Opportunity,draft?:string)=>{
  const existing=chats.find(c=>c.opportunityId===item.id&&(c.conversationType==='client'||c.conversationType==='recruiter'));
  if(existing&&!draft){setActive(existing.id);resetComposer();setSidebarOpen(true);return}
  const message:Message={id:uid(),role:'user',text:draft?.trim()||`Hello ${item.company}, I’m interested in ${item.title}. Could you share the next steps?`};
  const acknowledgment:Message={id:uid(),role:'assistant',text:'This is a simulated conversation. Your application has not been sent to a client or recruiter.'};
  if(existing){setChats(cs=>cs.map(c=>c.id===existing.id?{...c,messages:[...c.messages,message,acknowledgment]}:c));setActive(existing.id)}
  else{const conversation:Chat={id:uid(),title:`${item.company} · ${item.title}`,conversationType:item.kind==='job'?'recruiter':'client',opportunityId:item.id,messages:[message,acknowledgment]};setChats(cs=>[conversation,...cs]);setActive(conversation.id)}
  resetComposer();setSidebarOpen(true);
 };
 const openProfile=()=>{sidebarBeforeProfile.current=sidebarOpen;setSidebarOpen(false);setProfileOpen(true)};
 const closeProfile=()=>{setProfileOpen(false);setSidebarOpen(sidebarBeforeProfile.current)};
 const saveProfile=(draft:CareerProfile)=>{
  const next={...draft,name:draft.name.trim(),role:draft.role.trim(),skills:draft.skills.map(s=>s.trim()).filter(Boolean)};
  setProfile(next);closeProfile();
  const updatedContext=careerContext(chats.filter(c=>!c.conversationType||c.conversationType==='assistant').flatMap(c=>c.messages),next);
  setChats(cs=>cs.map(c=>({...c,messages:c.messages.map(m=>{
   if(!m.discovery)return m;const result=recommend(m.discovery.kind,updatedContext,viewed);
   return {...m,text:result.text,items:result.items,discovery:{...m.discovery,personalized:result.personalized,reasons:result.reasons}};
  })})));
 };
 const addFile=(files:FileList|null)=>{if(files)setAttachments(a=>[...a,...Array.from(files).map(f=>f.name)])};
 const toggleSave=(id:string)=>setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const doCopy=async(text:string)=>{await navigator.clipboard?.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1200)};
 const submit=(e:React.FormEvent)=>{e.preventDefault();send()};
 return <main className={`app ${light?'light':''} ${sidebarOpen?'sidebar-expanded':''}`}>
  <ChatMenu chats={chats} active={active} savedCount={saved.length} light={light} hasConversation={hasConversation} expanded={sidebarOpen} onExpandedChange={setSidebarOpen} onNew={newChat} onSelect={selectChat} onSaved={()=>send('Show my saved opportunities')} onAttach={()=>fileRef.current?.click()} onTheme={()=>setLight(!light)} onDiscover={discover} onDelete={deleteChat} onClear={clearSession} onProfile={openProfile} personalized={context.hasInfo}/>

  <section className={`workspace ${isNewConversation ? 'welcome-workspace' : 'active-workspace'}`} aria-label="Career conversation">
   {!isNewConversation&&<div className="chat-scroll"><div className="conversation">
    {(chat.conversationType==='client'||chat.conversationType==='recruiter')&&<div className="contact-chat-notice"><strong>{chat.title}</strong><span>Demo conversation · Messages and applications are not delivered</span></div>}
    {!context.hasInfo&&(!chat.conversationType||chat.conversationType==='assistant')&&<div className="personalization-notice">For a personalized experience, <button onClick={openProfile}>sign up</button> and provide your CV and portfolio.</div>}
    {chat.messages.map((m,i)=><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.24}} className={`message-row ${m.role}`} key={m.id}>

      <div className="message-body">{m.role==='user'?<div className="user-bubble">{m.text}</div>:<><div className="assistant-text">{m.text}</div>{m.profile&&<div className="profile-card"><div className="profile-head"><div className="profile-icon"><BriefcaseBusiness size={17}/></div><div><b>Profile snapshot</b><span>Based on your materials</span></div><span className="profile-level">MID-LEVEL</span></div><div className="profile-role">Frontend engineer <span>· 5 years experience</span></div><div className="skill-list">{['React','TypeScript','Next.js','Design systems','Accessibility','Product thinking'].map(x=><span key={x}>{x}</span>)}</div><div className="profile-foot"><span>Strongest fit</span><b>Product engineering · UI development</b></div></div>}{m.items&&<div className={`results-list ${expanded?.startsWith(m.id+':')?'has-expanded':''}`}>{m.items.slice(0,3).filter(id=>!expanded?.startsWith(m.id+':')||expanded===m.id+':'+id).map(id=>{const o=opportunities.find(x=>x.id===id);const key=m.id+':'+id;return o&&<OpportunityCard key={id} item={o} expanded={expanded===key} toggleExpanded={()=>{if(expanded===key){setExpanded(null)}else{setExpanded(key);setViewed(ids=>[...ids.filter(value=>value!==id),id].slice(-30))}}} saved={saved.includes(id)} onSave={()=>toggleSave(id)} onAsk={s=>send(s)} discovery={m.discovery} reason={m.discovery?.reasons[id]}/>})}</div>}{m.content&&<div className="generated"><div className="generated-head"><span><FileText size={14}/> Draft for you</span><div><button onClick={()=>doCopy(m.content!)}><Copy size={13}/>{copied?'Copied':'Copy'}</button><button onClick={()=>send('Regenerate this draft')}><Sparkles size={13}/>Regenerate</button></div></div><p>{m.content}</p>{m.opportunityId&&<div className="draft-actions"><button type="button" onClick={()=>{const item=opportunities.find(o=>o.id===m.opportunityId);if(item)startApplication(item,m.content)}}>Send demo application <ArrowUp size={13}/></button></div>}</div>}{i>0&&<div className="message-tools"><button title="Copy response" onClick={()=>doCopy(m.text)}>{copied?<Check size={13}/>:<Copy size={13}/>}</button></div>}</>}</div>
     </motion.div>)}
    {typing&&<div className="message-row assistant typing"><div className="typing-dots" role="status" aria-label="Assistant is thinking"><i/><i/><i/></div></div>}<div ref={end}/>
   </div></div>}
   <motion.div className="composer-wrap" layout="position" transition={{layout:{duration:reduceMotion?0:0.4,ease:[0.22,1,0.36,1]}}}>
    <AnimatePresence initial={false}>{isNewConversation&&<motion.div key="brand" className="welcome-brand" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0,marginBottom:0,y:-8}} transition={{duration:reduceMotion?0:0.2}}>
     <h1><svg className="morrow-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 30V17a6.5 6.5 0 0 1 13 0v13M20 30V17a6.5 6.5 0 0 1 13 0v13" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/><path d="m6 7 4-3M30 4l4 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg><span>morrow</span></h1>
     <p>Your next chapter starts with a conversation.</p>
    </motion.div>}</AnimatePresence>
    <form className="composer" onSubmit={submit}>

     <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple hidden onChange={e=>{addFile(e.target.files);e.target.value='';textarea.current?.focus()}}/>
     {attachments.length>0&&<div className="attachment-list">{attachments.map((a,i)=><span key={`${a}${i}`}><FileText size={13}/>{a}<button type="button" aria-label={`Remove ${a}`} onClick={()=>setAttachments(xs=>xs.filter((_,n)=>n!==i))}><X size={12}/></button></span>)}</div>}
     <div className="composer-line">
      <textarea ref={textarea} aria-label="Message your career assistant" value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,150)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder={chat.conversationType==='client'||chat.conversationType==='recruiter'?'Write a demo message...':'Ask anything about your career...'} rows={1}/>
     </div>
     <div className="composer-toolbar">

      <button type="submit" className="send-btn" disabled={!ready||typing||(!input.trim()&&!attachments.length)} aria-label="Send message"><ArrowUp size={18}/></button>
     </div>
    </form>
   </motion.div>
  </section>
  {profileOpen&&<ProfileDialog profile={profile} onClose={closeProfile} onSave={saveProfile}/>}
 </main>
}
function OpportunityCard({item,expanded,toggleExpanded,saved,onSave,onAsk,discovery,reason}:{item:Opportunity;expanded:boolean;toggleExpanded:()=>void;saved:boolean;onSave:()=>void;onAsk:(s:string)=>void;discovery?:Message['discovery'];reason?:string}){
 return <article className={`op-card ${expanded?'op-card-expanded':''}`}>
  <button type="button" className="op-card-main" onClick={toggleExpanded} aria-expanded={expanded}>
   <div className="op-top"><div className="company-mark">{item.logo}</div><div className="op-title"><b>{item.title}</b><span>{item.company} · {item.location}</span></div></div>
   <p className="op-summary">{item.summary}</p><div className="op-meta"><span>{item.type}</span><span>{item.compensation}</span></div>
   <span className="card-expand-label">{expanded?'Collapse':'View details'} <ChevronRight size={13}/></span>
  </button>
  <AnimatePresence initial={false}>{expanded&&<motion.div className="op-detail" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.18,ease:'easeOut'}}>
   <p>{item.description}</p>{reason&&<div className="why-match"><Sparkles size={14}/><span>{reason}</span></div>}
   <div className="op-meta expanded-meta"><span><BriefcaseBusiness size={13}/>{item.type}</span><span>{item.compensation}</span>{item.kind==='project'&&<span><Clock3 size={13}/>{item.duration}</span>}</div>
   <div className="op-skills">{item.skills.map(skill=><span key={skill}>{skill}</span>)}</div>
   <div className="detail-actions"><button type="button" onClick={()=>onAsk(`${item.kind==='job'?'Help me apply to':'Help me write a proposal for'} ${item.title}`)}>Prepare application <ArrowUp size={13}/></button></div>
  </motion.div>}</AnimatePresence>
  <div className="op-actions"><span>{discovery?(discovery.personalized?'For you':'Suggested'):'Opportunity'}</span><button type="button" className={`save-btn ${saved?'is-saved':''}`} onClick={onSave}>{saved?<BookmarkCheck size={14}/>:<Bookmark size={14}/>} {saved?'Saved':'Save'}</button></div>
 </article>
}
function respond(q:string,history:Message[],hasFile:boolean,context:CareerContext,saved:string[],viewed:string[]):Omit<Message,'id'|'role'>{const lower=q.toLowerCase();if(hasFile)return {text:'Your file is attached. This demo does not read its contents. Share your role, main skills, and preferred location, or complete your career profile, so I can suggest relevant opportunities.'};
 if(/analy[sz]|cv|resume|portfolio|github|linkedin/.test(lower))return {text:'Share your CV or portfolio using the menu, then tell me your role and main skills. You can also add these details to your career profile for personalized recommendations.'};
 if(/cover letter|proposal|draft|application introduction|regenerate|apply to|write.*application|interview|skill gap|improve.*cv/.test(lower)){const target=history.findLast(m=>m.opportunityId)?.opportunityId??history.findLast(m=>m.role==='assistant'&&m.items)?.items?.[0],item=opportunities.find(o=>lower.includes(o.title.toLowerCase()))??opportunities.find(o=>o.id===target);const kind=/proposal|freelance|project/.test(lower)?'proposal':'cover letter';return {text:`Here’s a tailored ${kind} draft you can make your own.`,opportunityId:item?.id,content:`Hello ${item?.company??'Hiring Team'},\n\nI’m excited to apply for the ${item?.title??'role'}. I’m a frontend engineer with five years of experience building thoughtful, accessible products with React and TypeScript. I care about the details that make complex experiences feel clear and natural.\n\nThe opportunity to contribute to ${item?.company??'your team'} stands out to me. My background in design systems and close collaboration with product and design teams would let me make a meaningful contribution from day one.\n\nI’d love to share more about how I approach building useful, polished interfaces. Thank you for your consideration.\n\nBest,\nAlex Morgan`}}
 if(!/compare|why.*match|more like|saved opportunities/.test(lower)){
  const kind:Opportunity['kind']=/freelance|project/.test(lower)?'project':/job|position|full.time/.test(lower)?'job':history.findLast(m=>m.discovery)?.discovery?.kind??'job';
  const result=recommend(kind,context,viewed);
  return {text:result.text,items:result.items,discovery:{kind,personalized:result.personalized,reasons:result.reasons}};
 }
 const wantsProject=/freelance|project|contract/.test(lower),wantsJob=/job|full.time|position|role|career/.test(lower),both=/both|all opportunities|everything/.test(lower);let results=opportunities.filter(o=>both||(!wantsProject&&!wantsJob)||o.kind===(wantsProject&&!wantsJob?'project':'job'));
 if(/remote|home|distributed/.test(lower))results=results.filter(o=>/remote/i.test(o.location));if(/europe|european|eu\b/.test(lower))results=results.filter(o=>/europe|paris|amsterdam|berlin|london|copenhagen/i.test(o.location));if(/react|typescript|next\.js/.test(lower)){const skills=['react','typescript','next.js'].filter(s=>lower.includes(s));results=results.filter(o=>skills.some(s=>o.skills.join(' ').toLowerCase().includes(s)))}if(/€?70k|70,000|above|over|salary/.test(lower)&&/€|k|salary|above|over/.test(lower))results=results.filter(o=>o.kind==='project'||/€|\$|£/.test(o.compensation)&&parseInt(o.compensation.replace(/[^0-9]/g,''))>=70000);if(/less than 3 months|under 3 months|short project/.test(lower))results=results.filter(o=>o.kind==='project'&&!/6|8/.test(o.duration));if(/saved opportunities/.test(lower))return {text:'Here are the opportunities you’ve saved so far. You can open any one to pick up where we left off.',items:opportunities.filter(o=>saved.includes(o.id)).map(o=>o.id)};
 if(/compare/.test(lower)){const previous=history.findLast(m=>m.role==='assistant'&&m.items);const ids=previous?.items??[];return {text:`Here’s a quick comparison. ${ids.length>1?'The first option is the strongest fit for a product-focused role, while the second gives you a broader platform engineering scope.':'I can compare two opportunities once we’ve found a few. Here are some strong options to start with.'}`,items:ids.length>1?ids.slice(0,2):results.slice(0,2).map(o=>o.id),discovery:previous?.discovery}}
 if(/why.*match|why.*good fit/.test(lower)){const previous=history.findLast(m=>m.role==='assistant'&&m.items);const ids=previous?.items??[];return {text:previous?.discovery?.reasons[ids[0]]||'This is a popular pick from the sample catalog. Share your skills and work preferences for a personalized match explanation.',items:ids.slice(0,1),discovery:previous?.discovery}}
 if(/more like/.test(lower)){const ids=history.findLast(m=>m.role==='assistant'&&m.items)?.items??[];const first=opportunities.find(o=>o.id===ids[0]);results=opportunities.filter(o=>o.id!==first?.id&&o.kind===first?.kind&&o.skills.some(s=>first?.skills.includes(s)))}
 if(results.length===0)return {text:'I couldn’t find a close match with those exact preferences in this demo set. Want to broaden the location or try a different skill?'};
 const typeLabel=results.every(o=>o.kind==='project')?'freelance projects':results.every(o=>o.kind==='job')?'roles':'opportunities';const filtered=results.slice(0,3);return {text:`${lower.includes('remote')?'Got it — I’ve focused on remote options. ':''}${lower.includes('europe')?'I’ve narrowed this to Europe. ':''}I found a few ${typeLabel} that look promising. These stand out for their overlap with your frontend experience and product instincts.`,items:filtered.map(o=>o.id)}
}
