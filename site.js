const menu=document.querySelector('.menu');const links=document.querySelector('.navlinks');
  menu?.setAttribute('aria-expanded','false');
  menu?.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');menu?.setAttribute('aria-expanded','false');}));
  const caseDetails=document.getElementById('caseDetails');
  const openCases=document.getElementById('openCases');
  const closeCases=document.getElementById('closeCases');
  const showCases=(targetId)=>{
    if(!caseDetails) return;
    caseDetails.querySelectorAll('img[data-src]').forEach(img=>{ if(!img.src) img.src=img.dataset.src; });
    caseDetails.hidden=false;
    if(targetId){
      requestAnimationFrame(()=>document.querySelector(targetId)?.scrollIntoView({behavior:'smooth',block:'start'}));
    }
  };
  openCases?.addEventListener('click',()=>showCases());
  closeCases?.addEventListener('click',()=>{
    if(caseDetails) caseDetails.hidden=true;
    document.getElementById('work')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.querySelectorAll('.work-link').forEach(a=>a.addEventListener('click',(e)=>{
    const href=a.getAttribute('href');
    if(href && href.startsWith('#')){e.preventDefault();showCases(href);}
  }));
  const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---- consolidated from index.html ---- */

(() => {
  const intro=document.getElementById('siteIntro');
  const canvas=document.getElementById('burnCanvas');
  const hit=document.getElementById('featherHit');
  if(!intro || !canvas || !hit) return;
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let introSeen=false;
  try{introSeen=sessionStorage.getItem('mm-intro-seen')==='1'}catch(e){}
  if(introSeen || reducedMotion){
    document.body.classList.remove('intro-active');
    intro.remove();
    return;
  }
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const img=new Image();
  let ready=false,locked=false;
  let clickX=W*.5, clickY=H*.72;
  let edgeNoise=[];
  let embers=[];

  function drawBase(){
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(img,0,0,W,H);
  }

  img.onload=()=>{ready=true;drawBase();};
  img.src='assets/single_feather_pearl.png';

  function easeOut(t){return 1-Math.pow(1-t,2.25)}
  function pointRadius(i,r,phase){
    const a=(i/96)*Math.PI*2;
    const n=edgeNoise[i]||0;
    return r*(1 + .045*Math.sin(a*5+phase) + .027*Math.sin(a*11-phase*1.4) + .018*n);
  }
  function pathFor(cx,cy,r,phase){
    const p=new Path2D();
    for(let i=0;i<96;i++){
      const a=(i/96)*Math.PI*2;
      const rr=pointRadius(i,r,phase);
      const x=cx+Math.cos(a)*rr;
      const y=cy+Math.sin(a)*rr*.92;
      if(i===0)p.moveTo(x,y); else p.lineTo(x,y);
    }
    p.closePath();return p;
  }

  function drawFlame(x,y,s,phase,alpha){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(Math.sin(phase*1.7)*.08);
    const grad=ctx.createRadialGradient(0,s*.18,2,0,s*.15,s*.72);
    grad.addColorStop(0,`rgba(255,255,225,${.94*alpha})`);
    grad.addColorStop(.22,`rgba(255,221,104,${.93*alpha})`);
    grad.addColorStop(.54,`rgba(255,137,35,${.88*alpha})`);
    grad.addColorStop(.78,`rgba(225,67,14,${.55*alpha})`);
    grad.addColorStop(1,'rgba(170,35,5,0)');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(0,-s);
    ctx.bezierCurveTo(s*.35,-s*.72,s*.42,-s*.34,s*.28,0);
    ctx.bezierCurveTo(s*.13,s*.22,-s*.12,s*.23,-s*.29,0);
    ctx.bezierCurveTo(-s*.42,-s*.33,-s*.27,-s*.69,0,-s);
    ctx.fill();
    ctx.restore();
  }

  function redrawBurn(p,time){
    drawBase();
    const e=easeOut(p);
    const r=28 + e*1180;
    const phase=time*.0016;
    const outer=pathFor(clickX,clickY,r+18,phase);
    const inner=pathFor(clickX,clickY,Math.max(0,r-7),phase+.22);

    // dark char rim, restricted to feather pixels
    ctx.save();
    ctx.globalCompositeOperation='source-atop';
    ctx.fillStyle=`rgba(56,32,18,${.42 + .34*Math.min(1,p*2)})`;
    ctx.fill(outer);
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle='#000';
    ctx.fill(inner);
    ctx.restore();

    // warm glowing edge just ahead of char
    ctx.save();
    ctx.globalCompositeOperation='source-atop';
    ctx.strokeStyle=`rgba(247,133,42,${Math.max(0,.82-p*.42)})`;
    ctx.lineWidth=7;
    ctx.shadowColor='rgba(255,127,32,.62)';ctx.shadowBlur=13;
    ctx.stroke(inner);
    ctx.restore();

    // erase consumed tissue/feather
    ctx.save();
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle='#000';
    ctx.fill(inner);
    ctx.restore();

    // flames ride the moving burn front for first 80%
    if(p<.82){
      const flameAlpha=Math.sin(Math.min(1,p/.12)*Math.PI/2) * (1-p/.92);
      const angles=[-2.2,-1.65,-1.1,-.55,.15,.75,1.35,2.0];
      angles.forEach((a,idx)=>{
        const rr=r*(.96 + .025*Math.sin(idx*1.8+phase));
        const x=clickX+Math.cos(a)*rr;
        const y=clickY+Math.sin(a)*rr*.92;
        const s=24 + 15*(.5+.5*Math.sin(phase*4+idx));
        drawFlame(x,y,s,phase+idx,Math.max(0,flameAlpha));
      });
    }

    // ember particles
    embers.forEach((em,idx)=>{
      const local=(p-em.start)/(1-em.start);
      if(local<=0||local>=1)return;
      const rr=r*(.96+em.radial);
      const bx=clickX+Math.cos(em.a)*rr;
      const by=clickY+Math.sin(em.a)*rr*.92;
      const x=bx+em.dx*local;
      const y=by-em.rise*local;
      const a=Math.sin(local*Math.PI)*.88;
      ctx.fillStyle=`rgba(245,139,46,${a})`;
      ctx.shadowColor='rgba(255,154,64,.75)';ctx.shadowBlur=5;
      ctx.beginPath();ctx.arc(x,y,em.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    });

    // soft smoke from ignition area
    if(p>.08 && p<.88){
      for(let i=0;i<5;i++){
        const q=(p*.95+i*.13)%1;
        const sx=clickX+(i-2)*12+Math.sin(phase+i)*9;
        const sy=clickY-r*.18-q*125;
        const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,22+q*22);
        gr.addColorStop(0,`rgba(92,92,92,${.12*(1-q)})`);
        gr.addColorStop(1,'rgba(120,120,120,0)');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,26+q*25,0,Math.PI*2);ctx.fill();
      }
    }
  }

  function burn(ev){
    if(locked||!ready)return;
    locked=true;intro.classList.add('burning');hit.disabled=true;
    try{sessionStorage.setItem('mm-intro-seen','1')}catch(e){}
    const rect=canvas.getBoundingClientRect();
    clickX=(ev.clientX-rect.left)/rect.width*W;
    clickY=(ev.clientY-rect.top)/rect.height*H;
    // keep ignition on the feather's central body
    clickX=Math.max(W*.30,Math.min(W*.70,clickX));
    clickY=Math.max(H*.16,Math.min(H*.88,clickY));
    edgeNoise=Array.from({length:96},(_,i)=>Math.sin(i*12.9898)*.7+Math.sin(i*4.77)*.3);
    embers=Array.from({length:44},(_,i)=>({a:(i/44)*Math.PI*2 + (i%5)*.07,start:.04+(i%11)*.045,dx:(i%2?1:-1)*(12+(i*7)%38),rise:45+(i*19)%105,size:1+(i%3)*.55,radial:(i%4)*.008}));
    const t0=performance.now(),dur=1950;
    function frame(t){
      const p=Math.min(1,(t-t0)/dur);
      redrawBurn(p,t);
      if(p<1)requestAnimationFrame(frame);
      else{
        setTimeout(()=>intro.classList.add('exit'),120);
        setTimeout(()=>{document.body.classList.remove('intro-active');intro.remove();window.scrollTo({top:0,behavior:'auto'});},920);
      }
    }
    requestAnimationFrame(frame);
  }
  hit.addEventListener('click',burn);
})();

/* ---- consolidated from index.html ---- */

(() => {
  const FA={
    "PORTFOLIO ↗":"نمونه‌کار ↗","Why the feather":"قصهٔ پر",
    "Story & About":"قصه و مسیر من",
    "The Simorgh feather":"قصهٔ پر سیمرغ",
    "If the work gets stuck, burn the feather.":"اگر کار گره خورد، پر را آتش بزنید.",
    "In the Shahnameh, the Simorgh gives Zal a few feathers from her plumage and tells him: when you need me, burn one — and I will come.":"در شاهنامه، سیمرغ هنگام خداحافظی با زال چند پر از بال خود به او می‌دهد و می‌گوید: هر وقت به یاری نیاز داشتی، یکی را در آتش بینداز؛ من خواهم آمد.",
    "The feather on this site comes from that story. If your business reaches a knot — a complex problem, a difficult decision, or a question that refuses to go away — burn the feather.":"پر این سایت از همان قصه آمده است. اگر در کسب‌وکارتان با مسئله‌ای پیچیده، تصمیمی دشوار یا گرهی روبه‌رو شدید که راهش روشن نیست، پر را آتش بزنید.",
    "I come for those moments.":"من برای همین لحظه‌ها می‌آیم.",
    "Burn the feather":"پر را آتش بزنید",
    "Start with the real problem.":"از خودِ مسئله شروع کنیم.",
    "The problem you see may not be the problem you have. I help business leaders find what actually deserves attention before teams spend time, energy and budget solving the wrong thing.":"مسئله‌ای که می‌بینیم، همیشه همان مسئله‌ای نیست که واقعاً داریم. من به مدیران کسب‌وکار کمک می‌کنم قبل از اینکه تیم‌ها وقت، انرژی و بودجه را صرف حلِ مسئلهٔ اشتباه کنند، بفهمند واقعاً چه چیزی ارزش توجه دارد.",
    "What is actually happening?":"واقعاً چه اتفاقی دارد می‌افتد؟",
    "What is the real problem?":"مسئلهٔ واقعی چیست؟",
    "What deserves action now?":"الان واقعاً کجا باید دست‌به‌کار شد؟",
    "How does the direction stay clear?":"چطور مسیر روشن می‌ماند؟",
    "You don’t need the answer to start.":"برای شروع لازم نیست جواب را بدانید.",
    "You need the right question.":"سؤالِ درست را لازم دارید.",
    "Ongoing context, sharper conversations and decision support beside the leadership team.":"همراهیِ مستمر برای فهمِ عمیق‌ترِ زمینه، گفت‌وگوهای دقیق‌تر و تصمیم‌گیری بهتر کنار تیم رهبری.",
    "Focused work around brand, positioning, customer experience, human insight or communication.":"یک همکاریِ متمرکز حول برند، جایگاه‌یابی، تجربهٔ مشتری، بینش انسانی یا ارتباطات.",
    "Four lenses":"چهار زاویه برای دیدن مسئله",
    "Business":"کسب‌وکار",
    "Human":"انسان",
    "Brand & Experience":"برند و تجربه",
    "Narrative":"روایت",
    "Story & About":"قصه و مسیر من",
    "View detailed cases":"دیدن جزئیات تجربه‌ها",
    "Hide detailed cases":"بستن جزئیات تجربه‌ها",
"Mohammadmahdi Azizmohammadi — Advisory":"محمدمهدی عزیزمحمدی — مشاوره استراتژیک","Light the feather to enter.":"فقط کافی‌ست پر را آتش بزنید.","MM / ADVISORY":"MM / مشاوره","MENU":"منو","Advisory":"مشاوره","Thinking":"رویکرد فکری","Work":"تجربه‌ها","Story":"قصه و روایت","About":"درباره من","Contact":"تماس","See clearly.":"واضح‌تر ببینید.","Decide better.":"بهتر تصمیم بگیرید.","I help business leaders make sense of complex problems — finding what really matters before deciding what to do next.":"من به مدیران کسب‌وکار کمک می‌کنم وسطِ مسئله‌های پیچیده، اصل ماجرا را پیدا کنند؛ قبل از این‌که برای حلِ مسئله‌ی اشتباه وقت، انرژی و بودجه بگذارند.","Brand":"برند","Customer Experience":"تجربه مشتری","Creative Strategy":"استراتژی خلاق","Human Insight":"بینش انسانی","Available for focused advisory partnerships.":"برای همکاری‌های مشاوره‌ای متمرکز، در دسترس‌ام.","Problem framing":"تعریف مسئله","The problem you see may not be the problem you have.":"مسئله‌ای که می‌بینیم، همیشه همان مسئله‌ای نیست که واقعاً داریم.","The work starts with finding the right problem.":"کار من از پیدا کردنِ مسئله‌ی درست شروع می‌شود؛ نه از عجله برای پیدا کردنِ جواب.","“Our content isn’t working.”":"«محتوای ما نتیجه نمی‌دهد.»","Maybe. Or maybe the brand has nothing meaningful to say.":"شاید. شاید هم مسئله خودِ محتوا نباشد؛ شاید برند هنوز حرف روشن و مهمی برای گفتن ندارد.","“Customers don’t trust us.”":"«مشتری‌ها به ما اعتماد ندارند.»","Maybe it’s communication. Or maybe the experience is telling a different story.":"شاید مشکل از چیزی باشد که می‌گوییم؛ شاید هم تجربه‌ای که مشتری از ما می‌گیرد، با حرف‌هایمان هم‌خوان نیست.","“Sales are slowing down.”":"«سرعت فروش پایین آمده.»","Advertising may be part of it. More advertising may not be the answer.":"تبلیغات شاید بخشی از راه‌حل باشد؛ اما جوابِ هر افت فروشی، تبلیغات بیشتر نیست.","“Our brand feels inconsistent.”":"«برندمان یکدست نیست.»","Maybe there is no shared direction behind the decisions.":"شاید مشکل از اجرا نباشد؛ شاید تصمیم‌ها از یک جهت و منطق مشترک نمی‌آیند.","A senior second brain for complex decisions.":"یک هم‌فکرِ ارشد برای وقت‌هایی که تصمیم ساده نیست.","My focus is the problem, the direction and the decisions. Internal teams and specialist partners bring them to life.":"من روی فهمِ مسئله، روشن‌کردنِ مسیر و بهترشدنِ تصمیم‌ها تمرکز می‌کنم؛ اجرا را تیم داخلی و متخصصان هر حوزه پیش می‌برند.","Strategic Advisory":"مشاوره استراتژیک","Independent perspective for complex questions, decisions and problem framing.":"یک نگاه مستقل برای سؤال‌های سخت، تصمیم‌های مهم و وقت‌هایی که هنوز خودِ مسئله هم کاملاً روشن نیست.","Strategic Partnership":"همراهی استراتژیک","An ongoing relationship built around deeper context, strategic conversations and decision support.":"یک همکاری مستمر برای فهم عمیق‌تر کسب‌وکار، گفت‌وگوی استراتژیک و همراهی در تصمیم‌های کلیدی.","Strategic Transformation":"تحول استراتژیک","A focused engagement around a defined challenge: brand, positioning, CX, insight or communication transformation.":"یک همکاری متمرکز برای یک چالش مشخص؛ از برند و جایگاه‌یابی تا تجربه مشتری، بینش یا بازطراحی ارتباطات.","Advisory philosophy":"فلسفه همکاری","The seat beside the decision-maker.":"جای من کنارِ تصمیم‌گیرنده است.","Close enough to understand the context. Independent enough to see it differently.":"آن‌قدر نزدیک که مسئله را از داخل بفهمم؛ آن‌قدر مستقل که اسیر عادت‌ها و پیش‌فرض‌های داخل سازمان نشوم.","There is room for independent thinking.":"برای نگاه مستقل جا باشد.","Decision-makers are part of the conversation.":"خودِ تصمیم‌گیرنده پای گفت‌وگو باشد.","There is a capable team around the work.":"تیمی باشد که بتواند تصمیم را به اجرا برساند.","Questions matter as much as answers.":"سؤالِ درست به اندازه جوابِ درست اهمیت داشته باشد.","Clarity matters more than activity.":"وضوح از شلوغی و حجمِ کار مهم‌تر باشد.","I don’t sit above the team.":"بالای سرِ تیم نمی‌ایستم.","I sit beside the problem.":"کنارِ مسئله می‌ایستم.","I start with the question, not the answer.":"من از سؤال شروع می‌کنم، نه از جوابِ آماده.","The useful part of strategy often happens before the solution: seeing what is actually happening and framing the problem clearly enough to make a better decision.":"بخش مهمِ استراتژی قبل از رسیدن به راه‌حل اتفاق می‌افتد: اول باید بفهمیم واقعاً چه خبر است، بعد مسئله را درست تعریف کنیم؛ تازه آن‌وقت می‌شود تصمیم بهتری گرفت.","SEE":"دیدن","What’s actually happening?":"واقعاً چه اتفاقی دارد می‌افتد؟","UNDERSTAND":"فهمیدن","Why is it happening?":"چرا این اتفاق می‌افتد؟","FRAME":"تعریف مسئله","What’s the real problem?":"اصلِ مسئله چیست؟","DECIDE":"تصمیم","What deserves action?":"کجا واقعاً باید دست‌به‌کار شد؟","GUIDE":"هدایت","How does direction stay clear?":"چطور مسیر را در ادامه روشن نگه داریم؟","Four lenses":"چهار زاویه برای دیدنِ مسئله","From a complex world to a clearer path.":"از دلِ پیچیدگی، به یک مسیر روشن‌تر.","Business":"کسب‌وکار","Reality.":"واقعیت.","Human":"انسان","Behavior.":"رفتار.","Brand & Experience":"برند و تجربه","Perception.":"برداشت.","Narrative":"روایت","Meaning.":"معنا.","Working together":"شیوهٔ همکاری","Bring me the problem.":"مسئله را بیاورید؛ از همان‌جا شروع می‌کنیم.","You’re dealing with a real, non-obvious business question.":"با یک مسئلهٔ واقعی و نه‌چندان بدیهی در کسب‌وکارتان طرف هستید.","You need sharper framing before faster execution.":"قبل از سریع‌تر عمل‌کردن، باید مسئله را دقیق‌تر و روشن‌تر ببینید.","You value both strategy and action.":"هم کیفیتِ فکر برایتان مهم است، هم کیفیتِ اجرا.","You’re open to seeing the situation differently.":"آماده‌اید وضعیت را از زاویه‌ای تازه ببینید.","“Sometimes clarity begins with one good question.”":"«بعضی وقت‌ها وضوح، از یک سؤال درست شروع می‌شود.»","How I work":"شیوهٔ همکاری","Start with the real problem.":"از خودِ مسئله شروع کنیم.","You don’t need a finished brief.":"لازم نیست با بریفِ آماده بیایید.","Bring the question that keeps circling back.":"همان سؤالی را بیاورید که مدام برمی‌گردد و هنوز جواب روشنی ندارد.","We frame it, challenge it and decide what actually deserves action.":"با هم بازش می‌کنیم، فرض‌ها را به چالش می‌کشیم و مشخص می‌کنیم واقعاً کجا باید دست‌به‌کار شد.","Then your team can move with a clearer direction.":"بعد تیم شما می‌تواند با مسیر روشن‌تری جلو برود.","“You don’t need the answer to start. You need the right question.”":"«برای شروع لازم نیست جواب را بدانید؛ کافی‌ست سؤالِ درست را روی میز بگذارید.»","Storytelling & cinema":"قصه‌گویی و سینما","Stories taught me something strategy couldn’t.":"قصه‌گویی چیزهایی به من یاد داد که استراتژی به‌تنهایی نمی‌توانست.","People want things. Fear things. Resist things. Contradict themselves. Change their minds. Businesses are made of those same people.":"آدم‌ها چیزی می‌خواهند، از چیزی می‌ترسند، مقاومت می‌کنند، با خودشان تناقض دارند و نظرشان عوض می‌شود. همین آدم‌ها هستند که کسب‌وکارها را می‌سازند.","Human behavior, under pressure.":"رفتارِ آدم‌ها، وقتی پای فشار و انتخاب وسط است.","Screenwriting sharpened the way I look at motivation, conflict, contradiction, emotional pacing and the gap between what people say and what they do.":"فیلمنامه‌نویسی باعث شده دقیق‌تر به انگیزه، تعارض، تناقض، ریتم احساسی و فاصله‌ی میان حرف و رفتارِ آدم‌ها نگاه کنم.","I didn’t get here in a straight line.":"مسیر حرفه‌ای من هیچ‌وقت خطِ مستقیم نبوده.","Engineering taught me systems. Field sales taught me real customers. Marketing taught me markets. Brand taught me meaning. CX taught me experience. Screenwriting taught me human motivation.":"مهندسی به من نگاهِ سیستمی داد. فروش میدانی، مواجهه‌ی واقعی با مشتری و جوابِ رد. بازاریابی، بازار و رقابت. برند، معنا. تجربه مشتری، فاصله‌ی وعده تا واقعیت. و فیلمنامه‌نویسی، فهمِ عمیق‌ترِ انگیزه‌ی آدم‌ها.","Engineering":"مهندسی","Systems and industrial reality.":"نگاه سیستمی و واقعیتِ صنعت.","Field Sales":"فروش میدانی","Real customers and real rejection.":"مشتری واقعی، مذاکره واقعی و جوابِ رد واقعی.","Marketing":"بازاریابی","Markets and attention.":"بازار، رقابت و جلبِ توجه.","The distance between promise and reality.":"فاصله‌ی وعده تا واقعیت.","Screenwriting":"فیلمنامه‌نویسی","Motivation, conflict and contradiction.":"انگیزه، تعارض و تناقض.","Selected work":"چند تجربه منتخب","Six stories.":"شش تجربه.","One way of thinking.":"یک شیوه‌ی نگاه.","Less about what was produced. More about what changed in the way the problem was seen.":"اینجا بیشتر از خودِ خروجی، روی تغییری تمرکز کرده‌ام که در تعریفِ مسئله و مسیرِ تصمیم اتفاق افتاد.","Nikan Hospitals":"بیمارستان‌های نیکان","Brand → Experience":"از برند تا تجربه","Nikan365":"نیکان ۳۶۵","Visit → Relationship":"از مراجعه تا رابطه","Hamrah Mechanic":"همراه مکانیک","Trust → Familiarity":"از اعتماد تا آشنایی","Khanoumi":"خانومی","Campaign → Participation":"از کمپین تا مشارکت","Baman":"بامن","Product → Relevance":"از محصول تا ارتباط با زندگیِ آدم‌ها","Azki Seller":"ازکی‌سلر","Communication → Trust → Activation → Growth":"ارتباطات ← اعتماد ← شروع همکاری ← رشد","Selected case":"تجربه منتخب","Signal":"آنچه دیدیم","Nikan was investing across brand, marketing, content, digital products and patient-facing touchpoints.":"نیکان هم‌زمان روی برند، بازاریابی، محتوا، محصولات دیجیتال و تجربه‌ی بیمار سرمایه‌گذاری می‌کرد.","Real problem":"مسئله واقعی","The brand wasn’t only being communicated. It was being experienced.":"برند فقط چیزی نبود که می‌گفتیم؛ بیمار آن را در تمام نقاط تماس تجربه می‌کرد.","Direction":"مسیر","From Brand Management to Brand Experience.":"از مدیریتِ برند به مدیریتِ تجربه‌ی برند.","Role":"نقش","Manager — Branding, Marketing & CX":"مدیر برند، بازاریابی و تجربه‌ی مشتری","Contribution":"نقش من","Led the shift from brand communication toward a broader patient-experience system.":"مسیر را از «ارتباطات برند» به سمتِ طراحی و مدیریتِ یکپارچه‌ترِ تجربه‌ی بیمار بردم.","digital healthcare platforms":"پلتفرم سلامت دیجیتال","500K+":"بیش از ۵۰۰ هزار","users in the Nikan365 ecosystem":"کاربر در اکوسیستم نیکان ۳۶۵","Brand → CX":"از برند به تجربه‌ی مشتری","a broader experience system":"نگاهی یکپارچه‌تر به تجربه‌ی بیمار","A patient’s relationship with a hospital is usually concentrated around a visit.":"رابطه‌ی بیمار با بیمارستان معمولاً حولِ همان مراجعه شکل می‌گیرد و خیلی زود تمام می‌شود.","The opportunity wasn’t just to digitize the visit. It was to extend the relationship beyond it.":"فرصت فقط دیجیتال‌کردنِ فرایندِ مراجعه نبود؛ می‌شد رابطه‌ی بیمار و بیمارستان را بعد از مراجعه هم ادامه داد.","From a digital platform to an ongoing patient relationship.":"از یک سرویس دیجیتال به رابطه‌ای مداوم با بیمار.","Helped shape Nikan365 as an ongoing patient-relationship layer within the wider digital ecosystem.":"در شکل‌گیری نیکان ۳۶۵ به‌عنوان بخشی از اکوسیستم دیجیتال نیکان برای حفظِ ارتباطِ مستمر با بیمار نقش داشتم.","users across the ecosystem":"کاربر در اکوسیستم","digital platforms in the wider transformation":"پلتفرم دیجیتال در این مسیر","continuity beyond the hospital encounter":"ادامه‌ی ارتباط پس از مراجعه","Buying and selling a car is high-friction: significant money, asymmetric information and fragile trust.":"خریدوفروش خودرو پرتنش است: پای پولِ زیادی در میان است، اطلاعاتِ دو طرف برابر نیست و اعتماد به‌سادگی آسیب می‌بیند.","Trust wasn’t only a rational issue. It was a relationship issue.":"اعتماد فقط با عدد و استدلال ساخته نمی‌شد؛ جنسِ رابطه هم باید عوض می‌شد.","From an automotive service to a familiar companion — «آشنا».":"از یک سرویسِ خودرو به یک همراهِ آشنا و قابل‌اعتماد: «آشنا».","Creative Director":"مدیر خلاقیت","Led creative direction, cultural reframing and brand storytelling around familiarity and trust.":"جهتِ خلاقه، بازتعریفِ مفهومِ «آشنایی» و روایتِ برند حول اعتماد را هدایت کردم.","+50%":"بیش از ۵۰٪","social audience growth recorded for the period":"رشد مخاطبان شبکه‌های اجتماعی در آن دوره","the cultural framing of familiarity":"بازتعریفِ فرهنگیِ «آشنایی»","a more human relationship model":"رابطه‌ای انسانی‌تر با مخاطب","Beauty is emotionally rich, yet communication can collapse into offers, products and promotional messages.":"دنیای زیبایی پر از احساس، هویت و میل است؛ اما ارتباطاتش خیلی راحت می‌تواند به محصول، تخفیف و پیامِ تبلیغاتی خلاصه شود.","The opportunity wasn’t simply to make campaigns more visible. It was to give people something to enter.":"هدف فقط این نبود که کمپین بیشتر دیده شود؛ می‌خواستیم مخاطب بتواند واردِ تجربه شود و در آن نقش داشته باشد.","From campaign communication to participatory brand experience.":"از یک کمپینِ یک‌طرفه به تجربه‌ای مشارکتی از برند.","Led campaign concepts, participatory ideas and phygital experiences across the brand.":"ایده و جهتِ خلاقِ کمپین‌ها، ایده‌های مشارکتی و تجربه‌های فیجیتالِ برند را هدایت کردم.","+30%":"بیش از ۳۰٪","sales lifts on campaign work, recorded for the period":"رشد فروش در کمپین‌های منتخب","Audience → Participant":"از مخاطب به مشارکت‌کننده","interaction over one-way messaging":"تعامل به‌جای پیامِ یک‌طرفه","Phygital":"فیجیتال","physical + digital participation":"ترکیب تجربه‌ی فیزیکی و دیجیتال","Digital financial products can be useful and still feel distant.":"یک محصول مالیِ دیجیتال ممکن است مفید باشد، اما هنوز برای آدم‌ها دور از زندگیِ واقعی‌شان به نظر برسد.","The gap wasn’t only between product and communication. It was between product logic and human relevance.":"فاصله فقط میان محصول و ارتباطات نبود؛ محصول هنوز دلیلِ کافی برای مهم‌بودن در زندگیِ کاربر نداشت.","From product communication to meaningful use.":"از توضیحِ محصول به پیدا کردنِ یک دلیلِ واقعی برای استفاده.","Creative Mind Lead":"رهبر ایده‌پردازی خلاق","Connected product communication with relevance, acquisition and growth-oriented creative work.":"ارتباطاتِ محصول را به نیازِ واقعیِ کاربر، جذب و ایده‌های رشد پیوند دادم.","+17%":"بیش از ۱۷٪","app-user growth from targeted campaigns":"رشد کاربران اپلیکیشن با کمپین‌های هدفمند","Creative × Growth":"خلاقیت × رشد","product communication linked to acquisition":"پیوندِ ارتباطات محصول با جذبِ کاربر","a more human reason to matter":"دلیلی ملموس‌تر و انسانی‌تر برای انتخابِ محصول","Flagship case · Azki Seller":"تجربه محوری · ازکی‌سلر","Communication was only the surface.":"ارتباطات فقط نوکِ مسئله بود.","The first problem wasn’t awareness. It was confidence.":"مسئله‌ی اول دیده‌شدن نبود؛ اطمینان بود.","Seller hesitation appeared around customer ownership, renewal, data, operational reliability and business value.":"تردیدِ فروشنده‌ها دورِ چند سؤال می‌چرخید: مشتری برای چه کسی می‌ماند؟ تمدید چه می‌شود؟ داده‌ها چقدر امن‌اند؟ عملیات چقدر قابل‌اتکاست؟ و در نهایت، این همکاری واقعاً چه ارزشی دارد؟","Supervisor Brand & Marketing Communications":"سرپرست ارتباطات برند و بازاریابی","Built the problem frame, trust architecture, seller lifecycle and growth-system direction.":"صورتِ مسئله، معماریِ اعتماد، مسیرِ رشدِ فروشنده و جهتِ کلیِ سیستم رشد را طراحی کردم.","Trust architecture":"معماری اعتماد","Don’t say “trust us.”":"فقط نگوییم «به ما اعتماد کنید».","Make trust inspectable.":"اعتماد را با شواهد نشان بدهیم، نه با ادعا.","Product Truth":"واقعیت محصول","Customer ownership · Renewal · Data · Rules":"مالکیت مشتری · تمدید · داده · قواعد","Operational Truth":"واقعیت عملیات","SLA · Issuance · Support · Problem resolution":"SLA · صدور · پشتیبانی · حل مسئله","Human Proof":"شواهد واقعی","Seller stories · Networks · Centers":"تجربه‌ی فروشنده‌ها · شبکه‌ها · مراکز","Seller journey":"مسیر فروشنده","A seller growth system.":"یک مسیرِ روشن برای رشدِ فروشنده.","DISCOVER":"آشنایی","Is this for me?":"آیا این مدل به دردِ من می‌خورد؟","TRUST":"اعتماد","Is my customer safe?":"آیا مشتری‌ام برای خودم می‌ماند؟","ACTIVATE":"شروع","Can I start?":"چقدر راحت می‌توانم شروع کنم؟","EARN":"درآمد","Does it make money?":"واقعاً برایم درآمد دارد؟","EXPAND":"گسترش","What else can I sell?":"چه چیزهای دیگری می‌توانم بفروشم؟","BUILD":"رشد","How do I grow?":"چطور کارم را بزرگ‌تر کنم؟","ADVOCATE":"توصیه","Why recommend it?":"چرا باید به بقیه پیشنهادش بدهم؟","Growth engines":"موتورهای رشد","Five growth engines.":"پنج موتور برای رشدِ فروشنده.","Seller Activation":"شروعِ کارِ فروشنده","Registration → Productive Seller":"از ثبت‌نام تا فروشنده‌ی فعال","Seller Economics":"منطقِ درآمدیِ فروشنده","Commission → Tangible Value":"از کمیسیون تا ارزشِ واقعی","Product Growth":"رشد محصول","Product × Ops × Marketing":"محصول × عملیات × بازاریابی","Business Growth":"رشد کسب‌وکار","Seller → Network → Center":"از فروشنده به شبکه و مرکز","Trust & Advocacy":"اعتماد و توصیه","Claim → Proof → Seller Voice":"از ادعا به شواهد واقعی، بعد به روایتِ خودِ فروشنده","Strategic output":"خروجی استراتژیک","The website as a Seller Decision Engine.":"وب‌سایت؛ نه فقط ویترین، بلکه ابزارِ تصمیم‌گیریِ فروشنده.","The website can do more than explain the product. It can help a seller make a decision.":"وب‌سایت فقط برای توضیحِ محصول نیست؛ باید به فروشنده کمک کند تصمیم بگیرد.","Question":"سؤال","What do I need to know?":"چه چیزهایی باید بدانم؟","Proof":"دلیل","Why should I believe it?":"چرا باید باورش کنم؟","Economics":"صرفه اقتصادی","Does it make sense?":"آیا برای من می‌صرفد؟","Opportunity":"فرصت رشد","Can this grow with me?":"آیا می‌توانم با این فرصت رشد کنم؟","Outputs":"خروجی‌ها","Seller-growth architecture · Trust-proof framework · Lifecycle & CRM direction · Website decision architecture · Claims governance · Five growth engines · Cross-functional operating model · 90-day roadmap · Creative territories.":"معماریِ رشدِ فروشنده · چارچوبِ اثباتِ اعتماد · طراحیِ چرخه‌ی عمر و CRM · معماریِ تصمیم‌گیریِ وب‌سایت · چارچوبِ مدیریتِ ادعاها · پنج موتورِ رشد · مدلِ همکاریِ بین‌تیمی · نقشه‌ی راهِ ۹۰روزه · قلمروهای خلاقه.","Azki Seller · The lesson":"ازکی‌سلر · آنچه از این تجربه یاد گرفتم","What problem framing does.":"وقتی مسئله را درست تعریف کنیم، مسیرِ راه‌حل عوض می‌شود.","What looked like a communication problem became a trust problem.":"چیزی که اول مسئله‌ی ارتباطات به نظر می‌رسید، در اصل مسئله‌ی اعتماد بود.","What looked like a trust problem became an activation problem.":"بعد معلوم شد مسئله فقط اعتماد هم نیست؛ فروشنده بعد از ثبت‌نام چطور واقعاً شروع به کار می‌کند؟","What looked like an activation problem became a growth-system problem.":"و همین سؤال ما را به مسئله‌ای بزرگ‌تر رساند: سیستمِ رشدِ فروشنده چطور باید کار کند؟","Bring me the problem.":"مسئله را بیاورید؛ از همان‌جا شروع می‌کنیم.","You don’t need a polished brief. If something in the business feels stuck, unclear, or important enough to deserve a sharper look, that’s enough to start.":"لازم نیست بریفِ بی‌نقص داشته باشید. اگر چیزی در کسب‌وکارتان گیر کرده، تصمیمی هنوز روشن نیست یا حس می‌کنید مسئلهٔ واقعی جای دیگری است، همان برای شروع کافی است.","Project-based engagements, strategic reviews and ongoing advisory are all possible.":"همکاری می‌تواند پروژه‌ای، دوره‌ای یا به‌صورت همراهیِ مستمر باشد.","Mohammadmahdi Azizmohammadi":"محمدمهدی عزیزمحمدی","Mohammadmahdi Azizmohammadi · Strategic Brand & Business Advisor · Story & Narrative Architect":"محمدمهدی عزیزمحمدی · مشاور استراتژیک برند و کسب‌وکار · معمار قصه و روایت"};
  const ATTR_FA={
    "Enter website":"ورود به سایت",
    "Burn the feather":"پر را آتش بزن",
    "Toggle menu":"باز و بسته کردن منو",
    "White feather illustration":"تصویر یک پر سفید",
    "Mohammadmahdi Azizmohammadi portrait":"پرتره محمدمهدی عزیزمحمدی",
    "White feather":"پر سفید",
    "Simorgh and Zal architectural sketch":"طرح اسکیسی سیمرغ و زال"
  };
  const textNodes=[];
  const originalText=new WeakMap();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
    if(!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    const p=node.parentElement;
    if(!p || ["SCRIPT","STYLE"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  let n;
  while(n=walker.nextNode()){textNodes.push(n);originalText.set(n,n.nodeValue);}
  const attrEls=[...document.querySelectorAll("[aria-label],[alt]")];
  attrEls.forEach(el=>{
    if(el.hasAttribute("aria-label")) el.dataset.origAria=el.getAttribute("aria-label");
    if(el.hasAttribute("alt")) el.dataset.origAlt=el.getAttribute("alt");
  });
  const meta=document.querySelector('meta[name="description"]');
  const originalMeta=meta?.getAttribute("content")||"";
  const originalTitle=document.title;
  function preserveSpace(orig,repl){
    const m1=orig.match(/^\s*/)?.[0]||"";
    const m2=orig.match(/\s*$/)?.[0]||"";
    return m1+repl+m2;
  }
  function setLanguage(lang,store=true){
    const faMode=lang==="fa";
    document.documentElement.lang=faMode?"fa":"en";
    document.documentElement.dir=faMode?"rtl":"ltr";
    textNodes.forEach(node=>{
      const orig=originalText.get(node);
      const key=orig.trim();
      const repl=faMode?(FA[key]??key):key;
      node.nodeValue=preserveSpace(orig,repl);
    });
    attrEls.forEach(el=>{
      if(el.dataset.origAria!==undefined) el.setAttribute("aria-label",faMode?(ATTR_FA[el.dataset.origAria]||el.dataset.origAria):el.dataset.origAria);
      if(el.dataset.origAlt!==undefined) el.setAttribute("alt",faMode?(ATTR_FA[el.dataset.origAlt]||el.dataset.origAlt):el.dataset.origAlt);
    });
    document.querySelectorAll("[data-lang-toggle]").forEach(btn=>{
      btn.textContent=faMode?"EN":"فارسی";
      btn.setAttribute("aria-label",faMode?"Switch to English":"تغییر زبان به فارسی");
    });
    document.title=faMode?"محمدمهدی عزیزمحمدی — مشاوره استراتژیک":originalTitle;
    if(meta) meta.setAttribute("content",faMode?"محمدمهدی عزیزمحمدی — مشاور استراتژیک برند و کسب‌وکار · معمار قصه و روایت":originalMeta);
    if(store) try{localStorage.setItem("mm-lang",lang)}catch(e){}
  }
  document.querySelectorAll("[data-lang-toggle]").forEach(btn=>btn.addEventListener("click",()=>setLanguage(document.documentElement.lang==="fa"?"en":"fa")));
  let saved="en";
  try{saved=localStorage.getItem("mm-lang")||"en"}catch(e){}
  setLanguage(saved,false);
})();