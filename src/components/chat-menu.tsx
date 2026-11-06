'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Bookmark, BriefcaseBusiness, Check, Clock3, Moon, MoreHorizontal, Paperclip, Plus, Search, Sparkles, Sun, PanelLeftClose, Trash2, UserRound } from 'lucide-react';
import type { Chat } from '@/lib/session';

type Props = {
  chats: Pick<Chat, 'id' | 'title' | 'conversationType'>[];
  active: string;
  hasConversation: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  savedCount: number;
  light: boolean;
  onNew: () => void;
  onSelect: (id: string) => void;
  onSaved: () => void;
  onAttach: () => void;
  onTheme: () => void;
  onDiscover: (kind: 'job'|'project') => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onProfile: () => void;
  personalized: boolean;
};

const shortcuts = [
  { label: 'Find a job', icon: BriefcaseBusiness, kind: 'job' as const },
  { label: 'Find freelance work', icon: Sparkles, kind: 'project' as const },
];

export function ChatMenu(props: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mobile, setMobile] = useState(false);
  const [viewport,setViewport]=useState({width:1024,height:768});
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const expanded = props.hasConversation && props.expanded;
  const showInfo = !props.hasConversation && infoOpen;
  const filteredChats = props.chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()));
  const assistantChats = filteredChats.filter(chat => !chat.conversationType || chat.conversationType === 'assistant');
  const contactChats = filteredChats.filter(chat => chat.conversationType === 'client' || chat.conversationType === 'recruiter');
  const hasContactChats = props.chats.some(chat => chat.conversationType === 'client' || chat.conversationType === 'recruiter');
  const renderChat = (chat: Pick<Chat, 'id' | 'title'>) => <div className="dialogue-row" key={chat.id}><button type="button" className="menu-action" aria-current={chat.id===props.active?'page':undefined} onClick={() => act(() => props.onSelect(chat.id))}><span>{chat.title}</span>{chat.id===props.active&&<Check size={13}/>}</button><button type="button" className="delete-dialogue" aria-label={`Delete ${chat.title}`} title="Delete conversation" onClick={()=>props.onDelete(chat.id)}><Trash2 size={14}/></button></div>;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => {setMobile(query.matches);setViewport({width:window.innerWidth,height:window.innerHeight});};
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => { if (props.hasConversation) setInfoOpen(false); }, [props.hasConversation]);

  const close = () => {
    setInfoOpen(false);
    props.onExpandedChange(false);
    trigger.current?.focus();
  };
  const act = (callback: () => void) => {
    setInfoOpen(false);
    if (mobile) props.onExpandedChange(false);
    callback();
  };

  useEffect(() => {
    if (!expanded && !showInfo) return;
    // A docked sidebar leaves keyboard focus in the conversation. Overlays contain it.
    if (showInfo) info.current?.querySelector<HTMLButtonElement>('button')?.focus();
    else if (mobile) trigger.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (showInfo && !root.current?.contains(event.target as Node)) setInfoOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setInfoOpen(false);
        props.onExpandedChange(false);
        trigger.current?.focus();
      }
      if (event.key === 'Tab' && (showInfo || mobile)) {
        const controls = Array.from(root.current?.querySelectorAll<HTMLElement>('button, input') ?? [])
          .filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', keyboard);
    };
  }, [expanded, showInfo, mobile, props.onExpandedChange]);

  const duration = reduceMotion ? 0 : 0.38;
  return <>
    <AnimatePresence>{expanded && mobile && <motion.button key="scrim" className="sidebar-scrim" aria-label="Close sidebar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0:0.2}} onClick={close}/>}</AnimatePresence>
    <motion.div ref={root} className={`chat-menu ${expanded?'is-sidebar':''}`} initial={false}
      role={expanded && mobile ? 'dialog' : undefined} aria-modal={expanded && mobile ? true : undefined} aria-label={expanded && mobile ? 'Career workspace' : undefined}
      animate={{ width: expanded ? Math.min(300,viewport.width-40) : 40, height: expanded ? viewport.height : 40, top: expanded ? 0 : 20, left: expanded ? 0 : 20, borderRadius: expanded ? 0 : 20 }}
      transition={{duration,ease:[0.22,1,0.36,1]}}>
      <motion.button type="button" ref={trigger} className="menu-trigger" aria-label={expanded ? 'Collapse sidebar' : showInfo ? 'Close information' : props.hasConversation ? 'Open sidebar' : 'More about Morrow'} aria-expanded={expanded || showInfo} aria-controls={expanded ? 'workspace-sidebar' : showInfo ? 'morrow-info' : undefined}
        initial={false} animate={{left:expanded?16:0,top:expanded?16:0}} transition={{duration,ease:[0.22,1,0.36,1]}}
        onClick={() => props.hasConversation ? props.onExpandedChange(!expanded) : setInfoOpen(!infoOpen)} whileTap={reduceMotion ? undefined : {scale:0.92}}>
        <AnimatePresence initial={false} mode="wait"><motion.span key={expanded?'collapse':'dots'} initial={{opacity:0,rotate:-45}} animate={{opacity:1,rotate:0}} exit={{opacity:0,rotate:45}} transition={{duration:reduceMotion?0:0.1}}>{expanded?<PanelLeftClose size={18}/>:<MoreHorizontal size={21}/>}</motion.span></AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {expanded && <motion.nav id="workspace-sidebar" key="sidebar" aria-label="Conversations and searches" className="sidebar-content" initial={{opacity:0,x:reduceMotion?0:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,transition:{duration:reduceMotion?0:0.08}}} transition={{delay:reduceMotion?0:0.1,duration:reduceMotion?0:0.22}}>
          <div className="sidebar-brand">morrow</div>
          <motion.div className="sidebar-scroll" layoutScroll>
            <button type="button" className="menu-action new-dialogue" onClick={() => act(props.onNew)}><Plus size={16}/><span>New conversation</span></button>
            <div className="menu-label">DISCOVER OPPORTUNITIES</div>
            <div className="search-templates">{shortcuts.map(({label,icon:Icon,kind}) => <button type="button" className="search-template" key={kind} onClick={() => act(() => props.onDiscover(kind))}><Icon size={17}/><span><b>{label}</b><small>{props.personalized?'Based on your skills and preferences':'Explore popular opportunities'}</small></span><ArrowUpRight size={14}/></button>)}</div>
            <div className="menu-divider"/>
            <div className="menu-label"><Clock3 size={12}/>YOUR DIALOGUES</div>
            <label className="menu-search"><Search size={14}/><input aria-label="Search conversations" placeholder="Find a conversation…" value={search} onChange={event => setSearch(event.target.value)}/></label>
            <div className="menu-history">
              {assistantChats.map(renderChat)}
              {!filteredChats.length && search && <p className="menu-note">No conversations found.</p>}
              <motion.div layout="position" transition={{layout:{duration:reduceMotion?0:0.28,ease:'easeOut'}}} className={`contact-conversations ${hasContactChats ? 'has-contacts' : ''}`}>
                <div className="contact-heading">Clients &amp; recruiters</div>
                {contactChats.map(renderChat)}
              </motion.div>
            </div>
          </motion.div>
          <div className="sidebar-footer">
            <button type="button" className="menu-action" onClick={()=>act(props.onProfile)}><UserRound size={16}/><span>Your career profile</span></button>
            <button type="button" className="menu-action" onClick={()=>act(props.onClear)}><Trash2 size={16}/><span>Clear session</span></button>
            <button type="button" className="menu-action" onClick={() => act(props.onSaved)}><Bookmark size={16}/><span>Saved opportunities</span><small>{props.savedCount}</small></button>
            <button type="button" className="menu-action" onClick={() => act(props.onAttach)}><Paperclip size={16}/><span>Attach CV or portfolio</span></button>
            <button type="button" className="menu-action" onClick={props.onTheme}>{props.light?<Moon size={16}/>:<Sun size={16}/>}<span>{props.light?'Switch to dark mode':'Switch to light mode'}</span></button>
            <p className="menu-note menu-footnote">Sample opportunities · Private to this browser</p>
          </div>
        </motion.nav>}
        {showInfo&&<motion.div key="info" id="morrow-info" ref={info} role="dialog" aria-label="About Morrow" className="menu-panel" initial={{opacity:0,scale:reduceMotion?1:0.9,y:reduceMotion?0:-8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:reduceMotion?1:0.95}} transition={{duration:reduceMotion?0:0.2}} style={{transformOrigin:'top left'}}>
          <div className="menu-name">A little about morrow<span>A conversation about what comes next.</span></div>
          <div className="search-templates">{shortcuts.map(({label,icon:Icon,kind}) => <button type="button" className="search-template" key={kind} onClick={() => act(() => props.onDiscover(kind))}><Icon size={17}/><span><b>{label}</b><small>{props.personalized?'Based on your skills and preferences':'Explore popular opportunities'}</small></span><ArrowUpRight size={14}/></button>)}</div>
          <p className="menu-note">Find a role that fits, discover freelance projects, and get help with applications. Tell me what you have in mind, or share your CV to begin.</p>
          <p className="menu-note">Browse popular opportunities now, or start a conversation to get recommendations tailored to your experience.</p>
          <div className="menu-divider"/>
          <button type="button" className="menu-action" onClick={()=>act(props.onProfile)}><UserRound size={16}/><span>Your career profile</span></button>
          <button type="button" className="menu-action" onClick={()=>act(props.onClear)}><Trash2 size={16}/><span>Clear session</span></button>
          <button type="button" className="menu-action" onClick={() => act(props.onAttach)}><Paperclip size={16}/><span>Attach CV or portfolio</span></button>
          <button type="button" className="menu-action" onClick={props.onTheme}>{props.light?<Moon size={16}/>:<Sun size={16}/>}<span>{props.light?'Switch to dark mode':'Switch to light mode'}</span></button>
        </motion.div>}
      </AnimatePresence>
    </motion.div>
  </>;
}
