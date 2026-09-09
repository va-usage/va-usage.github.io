'use strict';
const PredictionExamples = (() => {
  const BASE = 'static/data/prediction/';
  const sampleIds = ['p04_prefix01', 'p17_prefix01', 'p11_prefix01'];
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const num = value => Number(value).toFixed(3);
  const refKey = ref => JSON.stringify([ref.viewId, ref.subViewId, ...(ref.capabilityId ? [ref.capabilityId] : [])]);
  const state = {data:null, sample:sampleIds[0], model:'Qwen3.8-Flash', round:1};
  const modelName = name => name.replace(/^AZ-/, '');
  function referenceNames(record) {
    const names = new Map();
    for (const view of record.system_context.views || []) {
      for (const subview of view.subViews || []) {
        names.set(refKey({viewId:view.viewId,subViewId:subview.subViewId}), `${view.viewName} · ${subview.subViewName}`);
        for (const capability of subview.capabilities || []) names.set(refKey({viewId:view.viewId,subViewId:subview.subViewId,capabilityId:capability.capabilityId}), capability.capabilityName);
      }
    }
    return names;
  }
  function chips(refs, names, reference) {
    const target = reference ? new Set(reference.map(refKey)) : null;
    return `<div class="chips">${refs.map(ref => {const key=refKey(ref),match=target ? target.has(key) : null;const label=names.get(key) || ref.capabilityId || ref.subViewId;return `<span class="chip ${target ? (match ? 'match' : 'miss') : ''}" title="${html([ref.viewId,ref.subViewId,ref.capabilityId].filter(Boolean).join(' / '))}${target ? (match ? ' — in documented reference' : ' — outside documented reference') : ''}">${target ? `<span aria-hidden="true">${match ? '✓ ' : '+ '}</span>` : ''}${html(label)}</span>`;}).join('')}</div>`;
  }
  function images(paths, role, system) {
    return `<div class="episode-images">${paths.map(path => {const mapped=state.data.assets[`${role}:${path}`];if(!mapped) return '<p class="load-error">Source image unavailable.</p>';const url=BASE+mapped;return `<a href="${html(url)}" target="_blank" rel="noopener" aria-label="Open ${html(system)} ${role === 'input' ? 'observed' : 'reference'} image"><img src="${html(url)}" loading="lazy" decoding="async" alt="${html(system)}: ${role === 'input' ? 'source evidence for the completed analysis' : 'withheld source evidence for the documented continuation'}"></a>`;}).join('')}</div>`;
  }
  function systemHTML(record) {
    const names = referenceNames(record);
    const views = record.system_context.views.map(view => `<article><h4>${html(view.viewName)}</h4><p>${html(view.description)}</p>${(view.subViews || []).map(subview => `<details><summary>${html(subview.subViewName)}</summary><p>${html(subview.description)}</p><ul>${(subview.capabilities || []).map(capability => `<li><strong>${html(capability.capabilityName)}</strong> — ${html(capability.description)}</li>`).join('')}</ul></details>`).join('')}</article>`).join('');
    const coordinations = (record.system_context.coordinations || []).map(c => `<li><strong>${html(c.coordinationType.replace(/([a-z])([A-Z])/g,'$1 $2'))}</strong><br>${html(names.get(refKey(c.sourceCapabilityRef || c.source)) || c.source.subViewId)} → ${(c.targetCapabilityRefs || c.targets).map(t=>html(names.get(refKey(t)) || t.subViewId)).join('; ')}</li>`).join('');
    return views + `<article><h4>Coordination</h4><ul>${coordinations}</ul></article>`;
  }
  function workflowHTML(record, names) {
    const context = record.workflow_context;
    return `<p>${html(context.interpretation)}</p>${context.workflows.map(workflow => {
      const titles = new Map(workflow.stages.map(s=>[s.stageId,s.stageTitle]));
      return `<article><h4>${html(workflow.workflowTitle)}</h4><p>${html(workflow.workflowGoal)}</p><p>${html(workflow.applicabilityContext || workflow.description)}</p><ol>${workflow.stages.map(stage => `<li><strong>${html(stage.stageTitle)}</strong><p>${html(stage.localGoal)}</p><p>${html(stage.activitySummary)}</p>${stage.expectedOutcome ? `<p><em>Expected outcome:</em> ${html(stage.expectedOutcome)}</p>` : ''}${chips(stage.usedCapabilities || [],names)}</li>`).join('')}</ol>${(workflow.transitions || []).length ? `<details><summary>Workflow transitions</summary><ul>${workflow.transitions.map(t=>`<li>${html(titles.get(t.sourceStageId) || t.sourceStageId)} → ${html(titles.get(t.targetStageId) || t.targetStageId)}${t.inferenceType ? ` <span class="muted">(${html(t.inferenceType)})</span>` : ''}${t.description ? `: ${html(t.description)}` : ''}</li>`).join('')}</ul></details>` : ''}</article>`;
    }).join('')}`;
  }
  function predictionCard(row, names, gold) {
    if(!row) return '<p class="load-error">This model and round are unavailable.</p>';
    const withWorkflow = row.condition === 'with_workflow', p=row.prediction;
    const predicted = new Set(p.used_capabilities.map(refKey));
    const missed = gold.used_capabilities.filter(r=>!predicted.has(refKey(r)));
    return `<article class="prediction-card ${withWorkflow ? 'with' : ''}"><div class="condition-label">${withWorkflow ? 'With' : 'Without'} intended workflow</div><h4>${html(p.local_goal)}</h4><div class="prediction-scores"><span>Goal <b>${row.goal_match}/3</b></span><span>Subview F1 <b>${num(row.subview_f1)}</b></span><span>Capability F1 <b>${num(row.capability_f1)}</b></span></div><p>${html(p.rationale)}</p><details open><summary>Predicted capabilities</summary>${chips(p.used_capabilities,names,gold.used_capabilities)}${missed.length ? `<p class="small">Reference capabilities not predicted:</p>${chips(missed,names)}` : '<p class="small">All reference capabilities are included.</p>'}</details><details><summary>Predicted subviews</summary>${chips(p.used_subviews,names,gold.used_subviews)}</details><details><summary>Goal judgment · original response</summary><p lang="zh">${html(row.goal_rationale)}</p></details></article>`;
  }
  function renderPredictions() {
    const data=state.data, record=data.records.find(x=>x.sample_id===state.sample), gold=data.gold[state.sample].documented_next_move;
    const names=referenceNames(record);
    const rows=data.results.filter(x=>x.sample_id===state.sample && x.model===state.model && Number(x.round)===state.round);
    document.getElementById('prediction-comparison').innerHTML=['without_workflow','with_workflow'].map(condition=>predictionCard(rows.find(x=>x.condition===condition),names,gold)).join('');
    document.getElementById('prediction-pair-label').textContent=`${modelName(state.model)} · round ${state.round}. Scores below describe this pair of predictions, not the sample average.`;
  }
  function renderSample(updateHash=false) {
    const data=state.data, sid=state.sample, record=data.records.find(x=>x.sample_id===sid), gold=data.gold[sid].documented_next_move, display=data.display[sid];
    const mean=data.analysis.after.samples[sid].metrics.capability_f1, names=referenceNames(record);
    const models=[...new Set(data.results.map(x=>x.model))];
    document.querySelectorAll('[data-sample]').forEach(tab=>{const active=tab.dataset.sample===sid;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    const panel=document.getElementById('sample-panel');panel.setAttribute('aria-labelledby',`tab-${sid}`);
    panel.innerHTML=`<div class="sample-title-row"><div><h4 class="sample-role">${html(display.role)}</h4><p class="sample-id">${html(display.name)} · ${html(sid)} · after episode ${record.completed_prefix.length}</p></div><a href="${html(display.explorer_url)}" target="_blank" rel="noopener">Explore system ↗</a></div><p class="sample-summary">${html(display.summary)}</p><div class="sample-metric"><span><b>Sample-average Capability F1</b><br><small>Six models × three rounds per condition</small></span><strong>${num(mean.without)} → ${num(mean.with)} <small>without → with workflow</small></strong></div>
<div class="context-folds"><details class="fold"><summary>Ⅰ · System functionality</summary><div class="fold-body">${systemHTML(record)}</div></details><details class="fold"><summary>Ⅱ · Intended workflow</summary><div class="fold-body">${workflowHTML(record,names)}</div></details></div>
<section class="context-section"><h4 class="step-label">Ⅲ · Initial case context</h4><p>${html(record.case_context.initial_context)}</p></section>
<section class="context-section"><h4 class="step-label">Ⅳ · Observed prefix</h4>${record.completed_prefix.map(episode=>`<article class="episode"><h4>Episode ${episode.episode} · ${html(episode.local_goal)}</h4><ol>${episode.completed_steps.map(step=>`<li>${html(step)}</li>`).join('')}</ol>${images(episode.images,'input',display.name)}</article>`).join('')}</section>
<details class="fold reference-fold" open><summary><span><span class="reference-eyebrow">Prediction target</span><span class="reference-heading">Reference continuation</span><span class="reference-subtitle">Withheld from the model</span></span></summary><div class="fold-body"><p class="reference-note">The next episode, its image, and reference labels were not provided to the predictor. These are the documented targets used for evaluation.</p><article class="episode"><h4>Episode ${gold.index} · ${html(gold.goal)}</h4><ol>${gold.completed_steps.map(step=>`<li>${html(step)}</li>`).join('')}</ol>${images(gold.images,'target',display.name)}<h4>Reference subviews</h4>${chips(gold.used_subviews,names)}<h4>Reference capabilities</h4>${chips(gold.used_capabilities,names)}</article></div></details>
<div class="prediction-toolbar"><h4>Compare model predictions</h4><div class="prediction-controls"><label>Model <select id="prediction-model">${models.map(model=>`<option value="${html(model)}" ${model===state.model?'selected':''}>${html(modelName(model))}</option>`).join('')}</select></label><label>Round <select id="prediction-round">${[1,2,3].map(round=>`<option ${round===state.round?'selected':''}>${round}</option>`).join('')}</select></label></div></div><p class="small muted" id="prediction-pair-label"></p><div class="prediction-grid" id="prediction-comparison" aria-live="polite" aria-atomic="true"></div><p class="prediction-help">✓ In the documented reference · + Outside the documented reference. F1 uses exact functionality identifiers; a different continuation may still be useful.</p>`;
    document.getElementById('prediction-model').addEventListener('change', event=>{state.model=event.target.value;renderPredictions();});
    document.getElementById('prediction-round').addEventListener('change', event=>{state.round=Number(event.target.value);renderPredictions();});
    renderPredictions();
    if(updateHash) history.replaceState(null,'',`#sample-${sid}`);
  }
  function select(sample,updateHash=true) {if(!sampleIds.includes(sample) || !state.data) return;state.sample=sample;renderSample(updateHash);}
  async function load() {
    try {
      const response=await fetch(BASE+'payload.json');if(!response.ok) throw new Error('Prediction examples unavailable');
      const data=await response.json();
      if(sampleIds.some(sid=>!data.records.some(x=>x.sample_id===sid))) throw new Error('Incomplete sample collection');
      state.data=data;
      const deepLink=location.hash.replace('#sample-','');if(sampleIds.includes(deepLink)) state.sample=deepLink;
      renderSample();
      if(sampleIds.includes(deepLink)) document.getElementById('prediction-examples').scrollIntoView({block:'start'});
    } catch (_) {
      document.getElementById('sample-panel').innerHTML='<p class="load-error">The prediction examples could not be loaded. <button type="button" class="button" id="retry-predictions">Retry</button> You can also <a href="static/data/prediction/payload.json">download the sample data</a>.</p>';
      document.getElementById('retry-predictions').addEventListener('click',load);
    }
  }
  function init() {
    document.querySelectorAll('[data-sample]').forEach(tab=>{
      tab.addEventListener('click',()=>select(tab.dataset.sample));
      tab.addEventListener('keydown',event=>{const keys=['ArrowRight','ArrowLeft','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();let index=sampleIds.indexOf(tab.dataset.sample);index=event.key==='Home'?0:event.key==='End'?sampleIds.length-1:(index+(event.key==='ArrowRight'?1:-1)+sampleIds.length)%sampleIds.length;select(sampleIds[index]);document.querySelector(`[data-sample="${sampleIds[index]}"]`).focus();});
    });
    window.addEventListener('hashchange',()=>{const id=location.hash.replace('#sample-','');if(sampleIds.includes(id))select(id,false);});
    load();
  }
  return {init};
})();
document.addEventListener('DOMContentLoaded',PredictionExamples.init);
