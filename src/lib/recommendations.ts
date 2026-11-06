import { opportunities, type Opportunity } from './opportunities';

export type CareerProfile = { name: string; role: string; skills: string[]; location: string; cvName: string; portfolioUrl: string };
export type CareerContext = { skills: string[]; role: string; remote: boolean; location: string; hasInfo: boolean; minSalary?: number; currency?: string; maxWeeks?: number };
export type Recommendation = { items: string[]; personalized: boolean; reasons: Record<string,string>; text: string };
const skills = Array.from(new Set([...opportunities.flatMap(item=>item.skills), 'Python', 'Java', 'Rust', 'Angular', 'Svelte', 'SQL']));
const locations = ['Europe','London','Paris','Berlin','Amsterdam','Copenhagen','USA'];
const matchesWord = (text:string,word:string) => new RegExp(`(^|[^a-z])${word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}($|[^a-z])`,'i').test(text);

export function careerContext(messages: {role:string;text:string}[],profile:CareerProfile|null):CareerContext {
  // Only user-provided information contributes; assistant-generated profiles are not evidence.
  const text=messages.filter(message=>message.role==='user').map(message=>message.text).join(' ').toLowerCase();
  const detectedSkills=skills.filter(skill=>matchesWord(text,skill));
  const role=profile?.role.trim() || text.match(/\b(frontend|front.end|backend|full.stack|designer|design systems|product engineer|data scientist|marketing|accountant|nurse)\b/i)?.[0] || '';
  const location=profile?.location.trim() || locations.find(location=>matchesWord(text,location)) || '';
  const knownSkills=Array.from(new Set([...(profile?.skills??[]),...detectedSkills]));
  const remote=/\bremote\b/.test(`${text} ${location}`) && !/\b(not|no) remote\b/.test(text);
  const salary=text.match(/(?:above|over|at least|minimum)\s*(€|\$|£)?\s*(\d[\d,]*)(k)?/i);
  const minSalary=salary?Number(salary[2].replace(/,/g,''))*(salary[3]?1000:1):undefined;
  const duration=text.match(/(?:less than|under)\s*(\d+)\s*(months?|weeks?)/i);
  const maxWeeks=duration?Number(duration[1])*(duration[2].startsWith('month')?4.345:1):undefined;
  return {skills:knownSkills,role,remote,location,minSalary,currency:salary?.[1],maxWeeks,hasInfo:Boolean(knownSkills.length||role||location||remote||minSalary||maxWeeks)};
}

// Curated demo popularity order; this is independent of the mock match percentages.
const popularCompanies=['Vercel','Figma','Linear','Notion','Miro','GitLab','Sunday Supply','Northstar Studio','Fieldnotes','Orbit Health','Kinship','Civic Works'];
export function recommend(kind:Opportunity['kind'],context:CareerContext,viewed:string[]=[]):Recommendation {
  const viewedItems=viewed.map(id=>opportunities.find(item=>item.id===id)).filter((item):item is Opportunity=>Boolean(item));
  const interest=(item:Opportunity)=>viewedItems.reduce((score,seen)=>score+item.skills.filter(skill=>seen.skills.includes(skill)).length,0);
  let candidates=opportunities.filter(item=>item.kind===kind);
  const reasons:Record<string,string>={};
  if(!context.hasInfo){
    candidates.sort((a,b)=>interest(b)-interest(a)||(popularCompanies.indexOf(a.company)<0?99:popularCompanies.indexOf(a.company))-(popularCompanies.indexOf(b.company)<0?99:popularCompanies.indexOf(b.company)));
    if(viewedItems.length)candidates.forEach(item=>{if(interest(item))reasons[item.id]='Similar to opportunities you opened.'});
    return {items:candidates.slice(0,4).map(item=>item.id),personalized:false,reasons,text:viewedItems.length?`Here are ${kind==='job'?'jobs':'freelance projects'} related to opportunities you opened.`:`Here are popular ${kind==='job'?'jobs':'freelance projects'} from our sample catalog. Share your experience and preferences when you’re ready for recommendations tailored to you.`};
  }
  if(context.remote)candidates=candidates.filter(item=>/remote/i.test(item.location));
  if(context.location && !/remote|anywhere|global/i.test(context.location)){
    const location=context.location.toLowerCase();
    const european=/europe|european|^eu$/.test(location);
    candidates=candidates.filter(item=>item.location.toLowerCase().includes(location)||(european&&/Europe|London|Paris|Berlin|Amsterdam|Copenhagen|EU/.test(item.location))||/global/i.test(item.location)||(kind==='project'&&item.location==='Remote'));
  }
  if(context.minSalary&&kind==='job')candidates=candidates.filter(item=>{
    if(/day|hour/.test(item.compensation)||context.currency&&!item.compensation.startsWith(context.currency))return false;
    const amount=item.compensation.match(/(\d[\d,]*)(k)?/i);
    return amount?Number(amount[1].replace(/,/g,''))*(amount[2]?1000:1)>=context.minSalary!:false;
  });
  if(context.maxWeeks&&kind==='project')candidates=candidates.filter(item=>{
    const values=item.duration.match(/\d+/g)?.map(Number)??[];
    return values.length&&Math.max(...values)*(item.duration.includes('month')?4.345:1)<context.maxWeeks!;
  });
  const ranked=candidates.map(item=>{
    const overlap=context.skills.filter(skill=>item.skills.some(required=>required.toLowerCase()===skill.toLowerCase()));
    const roleTokens=context.role.toLowerCase().split(/[\s-]+/).filter(word=>word.length>2&&!['engineer','developer','senior','junior'].includes(word));
    const roleMatch=roleTokens.some(token=>`${item.title} ${item.summary} ${item.description}`.toLowerCase().includes(token));
    const reason=[overlap.length?`Uses ${overlap.join(', ')} from your shared skills`:null,roleMatch?`Relevant to your ${context.role} background`:null,context.remote?'Supports remote work':null,context.location?`Available for your ${context.location} preference`:null].filter(Boolean).join('. ');
    reasons[item.id]=reason||'Related to your shared career preferences.';
    return {item,score:overlap.length*5+(roleMatch?3:0)+interest(item),eligible:context.skills.length?overlap.length>0:context.role?roleMatch:true};
  }).filter(entry=>entry.eligible).sort((a,b)=>b.score-a.score);
  return {items:ranked.slice(0,4).map(entry=>entry.item.id),personalized:true,reasons,text:ranked.length?`Here are ${kind==='job'?'jobs':'freelance projects'} based on the skills and preferences you’ve shared. Each card explains the connection.`:'There are no close matches in this sample catalog for your current skills and preferences. Tell me which skills or locations you’d like to broaden.'};
}
