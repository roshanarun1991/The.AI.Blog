#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime as dt, email.utils, html, json, os, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/'index.html'
LOG=ROOT/'automation-log.md'
TZ=ZoneInfo('Europe/Stockholm')
CATS=['AI Agents','Getting Started','GitHub Repos','Automation','B2B Ideas','B2C Ideas','Research Tools','Video + Copy']
FEEDS=[('OpenAI News','https://openai.com/news/rss.xml'),('Anthropic News','https://www.anthropic.com/news/rss.xml'),('GitHub Changelog','https://github.blog/changelog/feed/'),('Hugging Face Blog','https://huggingface.co/blog/feed.xml'),('LangChain Blog','https://blog.langchain.com/rss/'),('n8n Blog','https://blog.n8n.io/rss/')]
KEYS={'agent':7,'agents':7,'mcp':7,'model context protocol':7,'codex':7,'copilot':6,'claude':6,'openai':6,'chatgpt':6,'gemini':6,'perplexity':5,'automation':6,'workflow':5,'github':5,'repository':4,'api':4,'tool':4,'tools':4,'rag':4,'eval':4,'security':4,'preview':2,'generally available':2}
STOP_TOPIC_WORDS={'the','and','with','from','into','about','using','use','uses','what','when','where','more','less','new','latest','update','updates','introducing','learn','build','building','make','makes','easier','guide','guides','today','release','released'}
BANNED_FALLBACK_LINES={'The useful question is simple: can this help a normal person save time, avoid copy-paste misery, learn faster, or build something small that actually works?','AI is not a wizard. It is more like an extremely confident spreadsheet that discovered theatre. Useful, dramatic, occasionally needs supervision.','Think of AI like a very fast intern with a suspicious amount of confidence. It can draft and organize, but you still need sources, checks, and approval.'}
REPO_QUERIES=[('GitHub AI agents','topic:ai-agents stars:>100 pushed:>2026-04-01'),('GitHub MCP tools','mcp server stars:>100 pushed:>2026-04-01'),('GitHub RAG apps','rag llm stars:>300 pushed:>2026-04-01'),('GitHub coding agents','coding agent stars:>100 pushed:>2026-04-01'),('GitHub agent frameworks','agent framework llm stars:>100 pushed:>2026-04-01')]
@dataclass
class Candidate:
    source:str; title:str; url:str; summary:str; published:dt.datetime|None; score:int

def now(): return dt.datetime.now(TZ)
def label(d): return f'{d.year}.{d.month}.{d.day:02d}'
def log(msg,write=False):
    print(msg)
    if write: LOG.write_text(f"# Automation log\n\nLast run: {now():%Y-%m-%d %H:%M:%S %Z}\n\n{msg}\n",encoding='utf-8')
def mode_target(mode):
    n=now()
    if mode=='daily': return 'daily',n.date()
    if mode=='fallback': return 'fallback',n.date()-dt.timedelta(days=1)
    if mode!='scheduled': raise SystemExit('Bad mode: '+mode)
    if n.hour>=21: return 'daily',n.date()
    if n.hour<=7: return 'fallback',n.date()-dt.timedelta(days=1)
    log(f'Scheduled run skipped at local hour {n.hour}; outside 21:00-07:00 publishing window.')
    return None

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'The.AI.Blog daily updater'})
    with urllib.request.urlopen(req,timeout=20) as r: return r.read().decode('utf-8','replace')
def clean(s): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s or ''))).strip()
def pdate(s):
    if not s: return None
    try:
        x=email.utils.parsedate_to_datetime(s)
        if x.tzinfo is None: x=x.replace(tzinfo=dt.timezone.utc)
        return x.astimezone(TZ)
    except Exception: return None

def iso_date(s):
    if not s: return None
    try: return dt.datetime.fromisoformat(s.replace('Z','+00:00')).astimezone(TZ)
    except Exception: return None

def score(src,title,summary,pub):
    blob=f'{src} {title} {summary}'.lower(); val=sum(v for k,v in KEYS.items() if k in blob)
    if pub: val+=max(0,12-max(0,(now().date()-pub.date()).days))
    return val

def text(node,names):
    for n in names:
        x=node.find(n)
        if x is not None and x.text: return x.text.strip()
    return ''
def atom_link(e):
    ns='{http://www.w3.org/2005/Atom}'
    for l in e.findall(f'{ns}link')+e.findall('link'):
        h=l.attrib.get('href')
        if h and l.attrib.get('rel','alternate')=='alternate': return h
    return text(e,[f'{ns}id','id'])
def parse_feed(src,url):
    try: root=ET.fromstring(get(url))
    except Exception as ex:
        log(f'Feed failed: {src}: {ex}'); return []
    out=[]; ns='{http://www.w3.org/2005/Atom}'
    for it in root.findall('.//item'):
        title=clean(text(it,['title'])); link=text(it,['link','guid']); summ=clean(text(it,['description','summary'])); pub=pdate(text(it,['pubDate','published','updated']))
        if title and link: out.append(Candidate(src,title,link,summ[:900],pub,score(src,title,summ,pub)))
    for e in root.findall(f'.//{ns}entry')+root.findall('.//entry'):
        title=clean(text(e,[f'{ns}title','title'])); link=atom_link(e); summ=clean(text(e,[f'{ns}summary',f'{ns}content','summary','content'])); pub=pdate(text(e,[f'{ns}published',f'{ns}updated','published','updated']))
        if title and link: out.append(Candidate(src,title,link,summ[:900],pub,score(src,title,summ,pub)))
    return out

def github_candidates():
    out=[]
    for src,q in REPO_QUERIES:
        url='https://api.github.com/search/repositories?q='+urllib.parse.quote(q)+'&sort=updated&order=desc&per_page=4'
        try: data=json.loads(get(url))
        except Exception as ex:
            log(f'GitHub search failed: {src}: {ex}'); continue
        for r in data.get('items',[]):
            title=clean(r.get('full_name',''))
            repo_url=r.get('html_url','')
            if not title or not repo_url: continue
            desc=clean(r.get('description') or 'Open-source AI builder repository')
            stars=int(r.get('stargazers_count') or 0)
            lang=r.get('language') or 'mixed'
            pushed=iso_date(r.get('pushed_at') or r.get('updated_at'))
            summary=f'{desc} Language: {lang}. Stars: {stars}. Useful signal: active public repo developers can inspect, fork, or learn from.'
            out.append(Candidate(src,title,repo_url,summary,pushed,score(src,title,summary,pushed)+min(10,stars//4000)+5))
    return out

def topic_tokens(title):
    toks=set()
    for w in re.findall(r'[a-z0-9]+',clean(title).lower()):
        if len(w)<4 or w in STOP_TOPIC_WORDS: continue
        if w.endswith('ies') and len(w)>5: w=w[:-3]+'y'
        elif w.endswith('s') and len(w)>4: w=w[:-1]
        toks.add(w)
    return toks

def too_similar(title,used_titles):
    toks=topic_tokens(title)
    if not toks: return False
    for old in used_titles:
        old_toks=topic_tokens(old)
        shared=toks & old_toks
        if len(shared)>=2 and len(shared)/max(1,min(len(toks),len(old_toks)))>=0.6:
            return True
    return False

def used_sources(block):
    urls=set(html.unescape(u).strip() for u in re.findall(r'<a href="([^"]+)"',block))
    titles=set(clean(t).lower() for t in re.findall(r'<strong>([\s\S]*?)</strong>',block))
    return urls,titles

def pick(block=''):
    items=[]
    for src,url in FEEDS: items+=parse_feed(src,url)
    items+=github_candidates()
    used_urls,used_titles=used_sources(block)
    items=[i for i in items if i.score>0]
    items.sort(key=lambda c:(c.score,c.published or dt.datetime(1970,1,1,tzinfo=TZ)),reverse=True)
    fresh=[i for i in items if i.url not in used_urls and clean(i.title).lower() not in used_titles and not too_similar(i.title,used_titles)]
    choices=fresh or [i for i in items if i.url not in used_urls and clean(i.title).lower() not in used_titles] or items
    return choices[0] if choices else Candidate('GitHub AI topics','Build one tiny AI workflow before chasing every new tool','https://github.com/topics/ai-agents','Pick one repeated task, connect one AI model, add one human approval step, and ship a tiny workflow before expanding the stack.',now(),1)

def infer(c):
    b=f'{c.source} {c.title} {c.summary}'.lower(); cats=[]
    if any(x in b for x in ['agent','copilot','mcp','codex','claude','gemini']): cats.append('AI Agents')
    if any(x in b for x in ['github','repo','repository','open source']): cats.append('GitHub Repos')
    if any(x in b for x in ['automation','workflow','tool','api','mcp']): cats.append('Automation')
    if any(x in b for x in ['research','search','rag','eval']): cats.append('Research Tools')
    cats+=['B2B Ideas','B2C Ideas']
    return [x for x in CATS if x in cats][:5] or ['AI Agents','Automation','B2B Ideas','B2C Ideas']

def extract_json(s):
    m=re.search(r'\{[\s\S]*\}',s.strip())
    try: return json.loads(m.group(0) if m else s)
    except Exception: return None

def ai_write(c,date,cats,block=''):
    key=os.getenv('OPENAI_API_KEY')
    if not key: return None
    prompt=f"""Date: {date}\nSource owner: {c.source}\nSource title: {c.title}\nSource URL: {c.url}\nSource summary: {c.summary}\nCategories: {', '.join(cats)}\nReturn JSON only with title, reading_time, categories, sections array of 5-7 objects with heading and paragraphs array, and links array. Explain in layman terms, add useful humor, B2B/B2C angles, beginner action steps, and credit the source owner. Do not invent facts."""
    data={'model':os.getenv('OPENAI_MODEL','gpt-4.1-mini'),'messages':[{'role':'system','content':'You write The.AI.Blog by Roshan Arun. Practical, beginner-friendly, source-backed, slightly playful. JSON only.'},{'role':'user','content':prompt}],'response_format':{'type':'json_object'},'temperature':0.7}
    try:
        req=urllib.request.Request('https://api.openai.com/v1/chat/completions',data=json.dumps(data).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
        with urllib.request.urlopen(req,timeout=60) as r: res=json.loads(r.read().decode())
        return extract_json(res['choices'][0]['message']['content'])
    except Exception as ex:
        log('OpenAI generation failed, using fallback: '+str(ex)); return None

def joke_line(c):
    jokes=[
        'A good automation is like a tiny employee who loves checklists, never asks for coffee, and still needs a manager before touching production.',
        'If the workflow needs eleven tabs, two exports, and a small emotional reset, congratulations: you have found automation compost.',
        'The best AI tool is not the loudest one. It is the one that removes a boring step so quietly you almost miss complaining about it.',
        'Give the agent one job and a short leash. The leash is not rude. The leash is architecture.',
        'Do not build a spaceship for a sandwich run. One trigger, one model call, one saved result. Luxury comes later.'
    ]
    return jokes[sum(ord(ch) for ch in c.title+c.source)%len(jokes)]

def builder_angle(c):
    blob=f'{c.source} {c.title} {c.summary}'.lower()
    if any(x in blob for x in ['github','repo','copilot','codex','code']):
        return ('Developer angle','Use this as a reason to make your AI stack swappable and testable: keep prompts, model choice, tool permissions, and output checks in separate places. Repos to explore: vercel/ai, BerriAI/litellm, promptfoo, Langfuse, and OpenAI Agents SDK.')
    if any(x in blob for x in ['mcp','tool','connector','api']):
        return ('Tool angle','The value is not the model alone. The value is the tool connection: calendar, files, CRM, browser, database, or GitHub. Add one permission boundary and one approval step before the agent can do anything expensive.')
    if any(x in blob for x in ['rag','search','research','crawl','browser']):
        return ('Research angle','This is useful for research workflows: collect sources, summarize them, score usefulness, and save citations. Try Firecrawl, Crawl4AI, Perplexity, LlamaIndex, or Haystack before inventing your own search circus.')
    if any(x in blob for x in ['agent','workflow','automation']):
        return ('Agent angle','Think in loops: trigger, context, model decision, tool call, memory, human approval, output. That pattern can become a support bot, lead researcher, price watcher, learning coach, or internal team assistant.')
    return ('Builder angle','Turn the update into one tiny product idea: one input, one AI transformation, one saved output, and one human approval. If it cannot fit on a napkin, it is probably version three pretending to be version one.')

def tiny_project(c):
    blob=f'{c.source} {c.title} {c.summary}'.lower()
    if 'security' in blob or 'secret' in blob:
        return 'Build a secrets-safe agent checklist: scan a project, list which keys are needed, explain where each key should live, and block anything that looks pasted into code.'
    if 'repo' in blob or 'github' in blob or 'code' in blob:
        return 'Build a GitHub issue assistant: read one issue, summarize the likely cause, suggest files to inspect, and draft a pull-request checklist for a human to approve.'
    if 'research' in blob or 'search' in blob or 'crawl' in blob:
        return 'Build a daily research scout: read three trusted sources, summarize what changed, rank usefulness, and save the top item to your blog or notes.'
    if 'agent' in blob or 'workflow' in blob:
        return 'Build a tiny workflow bot: scheduled trigger, one model call, one tool connection, one approval step, and a saved result. No 47-node dashboard drama.'
    return 'Build a one-page learning assistant: paste a confusing article, get a plain-English summary, three action steps, and links worth reading next.'

def fallback(c,cats):
    t=c.title if len(c.title)<=95 else c.title[:92].rstrip()+'...'
    heading,angle=builder_angle(c)
    return {'title':t,'reading_time':'5 min read','categories':cats,'sections':[{'heading':'What changed','paragraphs':[f"Today's useful AI signal comes from {c.source}: {c.title}.",c.summary or 'The source points to a real product, release, repository, or workflow instead of vague hype.']},{'heading':'Why it is useful','paragraphs':[angle,joke_line(c)]},{'heading':'Tiny project idea','paragraphs':[tiny_project(c),'Keep the first version tiny: one input, one AI step, one output, and one place where you approve the result. Small workflows grow up better than overbuilt monsters.']},{'heading':'Tools to explore','paragraphs':['Useful builder tools to keep nearby: Codex or Claude Code for coding help, Vercel AI SDK or Pydantic AI for app structure, MCP for tool connections, n8n or Dify for low-code workflows, and Langfuse or Phoenix for tracing.','Pick only what the project needs. Tool collecting is fun, but so is buying gym clothes; neither counts as doing the work.']},{'heading':'Credit','paragraphs':[f'Credit to {c.source} for the original source. This blog adds a beginner-friendly builder explanation and links back below.']}],'links':[{'label':c.source+': original source','url':c.url}]}

def safe_cats(v,fb):
    return [str(x).strip() for x in v if str(x).strip() in CATS] if isinstance(v,list) and any(str(x).strip() in CATS for x in v) else fb

def render(post,c,date,cats):
    cats=safe_cats(post.get('categories'),cats); ct=', '.join(cats); title=html.escape(str(post.get('title') or c.title)[:120]); rt=html.escape(str(post.get('reading_time') or '5 min read'))
    parts=[]
    for sec in (post.get('sections') if isinstance(post.get('sections'),list) else fallback(c,cats)['sections'])[:8]:
        if not isinstance(sec,dict): continue
        parts.append(f"                    <h4>{html.escape(str(sec.get('heading') or 'Builder note'))}</h4>")
        ps=sec.get('paragraphs'); ps=[ps] if isinstance(ps,str) else ps
        if isinstance(ps,list):
            for p in ps[:4]:
                s=html.escape(str(p).strip())
                if s: parts.append('                    <p>\n                      '+s+'\n                    </p>')
    links=post.get('links') if isinstance(post.get('links'),list) else []
    links.append({'label':c.source+': original source','url':c.url})
    link_html=[]; seen=set()
    for l in links[:4]:
        if not isinstance(l,dict): continue
        u=str(l.get('url','')).strip(); lab=str(l.get('label','Source')).strip()
        if u and u not in seen:
            seen.add(u); link_html.append(f'                  <a href="{html.escape(u,quote=True)}">{html.escape(lab)}</a>')
    lines=['              <article class="post-row" data-topics="'+html.escape(ct,quote=True)+'">','                <button class="row-main" type="button" aria-expanded="false">','                  <time>'+date+'</time>','                  <strong>'+title+'</strong>','                  <span>+</span>','                </button>','                <div class="row-detail">','                  <div class="metadata">','                    <b>/ METADATA</b>','                    <dl>','                      <dt>Date:</dt><dd>'+date+'</dd>','                      <dt>Author:</dt><dd>Roshan Arun</dd>','                      <dt>Reading time:</dt><dd>'+rt+'</dd>','                      <dt>Categories:</dt><dd>'+html.escape(ct)+'</dd>','                    </dl>','                    <b>/ ARTICLE</b>','                  </div>','                  <div class="article-copy">']
    lines += parts
    lines += ['                  </div>'] + link_html + ['                </div>','              </article>']
    return '\n'.join(lines)

def split_posts(txt):
    s='              <!-- DAILY_POSTS_START -->'; e='              <!-- DAILY_POSTS_END -->'
    if s not in txt or e not in txt: raise SystemExit('Daily post markers not found')
    a,r=txt.split(s,1); b,c=r.split(e,1); return a+s,b,e+c

def counts(txt):
    _,b,_=split_posts(txt); n=len(re.findall(r'<article class="post-row" data-topics="',b)); cc={x:0 for x in CATS}
    for topics in re.findall(r'data-topics="([^"]+)"',b):
        for t in [p.strip() for p in html.unescape(topics).split(',')]:
            if t in cc: cc[t]+=1
    txt=re.sub(r'(<div class="page-title">\s*<h1>Blog</h1>\s*<span>\()\d+(\)</span>)',lambda m:f'{m.group(1)}{n:02d}{m.group(2)}',txt,1)
    def repl(m):
        pre,key,lab,old,suf=m.groups(); val=n if key=='all' else cc.get(key,0); return f'{pre}{lab}({val:02d}){suf}'
    return re.sub(r'(<button type="button" class="filter-chip(?: active)?" data-filter="([^"]+)"><span></span>)(.*?)(\(\d+\))(</button>)',repl,txt)

def validate(txt):
    if txt.count('<article')!=txt.count('</article>'): raise SystemExit('Article tags unbalanced')
    if 'DAILY_POSTS_START' not in txt or 'DAILY_POSTS_END' not in txt: raise SystemExit('Markers missing')
def existing_dates(block):
    dates=[]
    for y,m,d in re.findall(r'<time>(\d{4})\.(\d{1,2})\.(\d{2})</time>',block):
        try: dates.append(dt.date(int(y),int(m),int(d)))
        except ValueError: pass
    return sorted(set(dates))

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--mode',default=os.getenv('WORKFLOW_MODE','scheduled'),choices=['daily','fallback','scheduled']); args=ap.parse_args(); target=mode_target(args.mode)
    if not target: return
    mode,d=target; dl=label(d); txt=INDEX.read_text(encoding='utf-8'); before,block,after=split_posts(txt)
    if args.mode=='scheduled':
        dates=existing_dates(block)
        if dates:
            next_missing=dates[-1]+dt.timedelta(days=1)
            if next_missing<=d:
                d=next_missing; dl=label(d)
    if f'<time>{dl}</time>' in block: log(f'No update needed: {dl} already exists ({mode}).'); return
    cand=pick(block); cats=infer(cand); post=ai_write(cand,dl,cats,block) or fallback(cand,cats); row=render(post,cand,dl,cats)
    new=counts(before+'\n'+row+block+after); validate(new); INDEX.write_text(new,encoding='utf-8',newline='\n'); log(f'Added {dl} from {cand.source}: {cand.title}\nSource: {cand.url}',True)
if __name__=='__main__': main()
