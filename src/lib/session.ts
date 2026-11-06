import type { CareerProfile } from './recommendations';
export type Message={id:string;role:'assistant'|'user';text:string;items?:string[];profile?:boolean;content?:string;opportunityId?:string;discovery?:{kind:'job'|'project';personalized:boolean;reasons:Record<string,string>}};
export type Chat={id:string;title:string;messages:Message[];conversationType?:'assistant'|'client'|'recruiter';opportunityId?:string};
export type Session={chats:Chat[];active:string;saved:string[];profile:CareerProfile|null; viewed?:string[]};
export const welcome="Hi. I'm your AI career assistant.\n\nI can help you find jobs and freelance projects that match your experience, skills, and interests. Share your CV, portfolio, or a little about what you’re looking for.\n\nI can also help you compare opportunities and prepare applications. What would you like to explore?";
export const uid=()=>Math.random().toString(36).slice(2,11);
export const createChat=():Chat=>({id:uid(),title:'New conversation',messages:[{id:uid(),role:'assistant',text:welcome}]});
export const SESSION_KEY='morrow-session-v2';
export const freshSession=():Session=>{const chat=createChat();return {chats:[chat],active:chat.id,saved:[],profile:null,viewed:[]}};
export function readSession(storage:Storage):Session {
  const raw=storage.getItem(SESSION_KEY);
  if(raw){
    try{const value=JSON.parse(raw) as Session;
      if(Array.isArray(value.chats)&&value.chats.length&&value.chats.every(chat=>typeof chat.id==='string'&&typeof chat.title==='string'&&Array.isArray(chat.messages)&&chat.messages.every(message=>typeof message.text==='string'&&['user','assistant'].includes(message.role)))&&Array.isArray(value.saved)){
        return {...value,active:value.chats.some(chat=>chat.id===value.active)?value.active:value.chats[0].id,profile:value.profile&&Array.isArray(value.profile.skills)?value.profile:null};
      }
    }catch{}
  }
  // Reset the old demo session once, as requested. Future sessions use the new key.
  ['morrow-chats','morrow-saved','morrow-profile'].forEach(key=>storage.removeItem(key));
  const session=freshSession();storage.setItem(SESSION_KEY,JSON.stringify(session));return session;
}
