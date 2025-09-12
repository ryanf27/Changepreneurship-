export function toCode({ phase, tab, section, question }) {
  return [phase, tab, section, question].join('.');
}

export function fromCode(code) {
  const [phase = 1, tab = 1, section = 1, question = 1] =
    code?.split('.').map((n) => parseInt(n, 10)) || [];
  return { phase, tab, section, question };
}

// structure nodes have shape { code:number, order:number, id:string, tabs:[...], sections:[...], questions:[...] }
export function normalizePath(path, structure) {
  const phase =
    structure.find((p) => p.code === (path.phase || path.p)) || structure[0];
  const tab =
    phase.tabs.find((t) => t.code === (path.tab || path.t)) || phase.tabs[0];
  const section =
    tab.sections.find((s) => s.code === (path.section || path.s)) || tab.sections[0];
  const question =
    section.questions.find((q) => q.code === (path.question || path.q)) ||
    section.questions[0];
  return {
    phase: phase.code,
    tab: tab.code,
    section: section.code,
    question: question.code,
  };
}

export function getNext(path, structure) {
  const { phase, tab, section, question } = normalizePath(path, structure);
  const phaseNode = structure.find((p) => p.code === phase);
  const tabNode = phaseNode.tabs.find((t) => t.code === tab);
  const sectionNode = tabNode.sections.find((s) => s.code === section);
  const qIndex = sectionNode.questions.findIndex((q) => q.code === question);
  if (qIndex < sectionNode.questions.length - 1) {
    return { phase, tab, section, question: sectionNode.questions[qIndex + 1].code };
  }
  const sIndex = tabNode.sections.findIndex((s) => s.code === section);
  if (sIndex < tabNode.sections.length - 1) {
    const nextSection = tabNode.sections[sIndex + 1];
    return { phase, tab, section: nextSection.code, question: nextSection.questions[0].code };
  }
  const tIndex = phaseNode.tabs.findIndex((t) => t.code === tab);
  if (tIndex < phaseNode.tabs.length - 1) {
    const nextTab = phaseNode.tabs[tIndex + 1];
    const nextSection = nextTab.sections[0];
    return { phase, tab: nextTab.code, section: nextSection.code, question: nextSection.questions[0].code };
  }
  const pIndex = structure.findIndex((p) => p.code === phase);
  if (pIndex < structure.length - 1) {
    const nextPhase = structure[pIndex + 1];
    const nextTab = nextPhase.tabs[0];
    const nextSection = nextTab.sections[0];
    return { phase: nextPhase.code, tab: nextTab.code, section: nextSection.code, question: nextSection.questions[0].code };
  }
  return { phase, tab, section, question };
}

export function getPrev(path, structure) {
  const { phase, tab, section, question } = normalizePath(path, structure);
  const phaseNode = structure.find((p) => p.code === phase);
  const tabNode = phaseNode.tabs.find((t) => t.code === tab);
  const sectionNode = tabNode.sections.find((s) => s.code === section);
  const qIndex = sectionNode.questions.findIndex((q) => q.code === question);
  if (qIndex > 0) {
    return { phase, tab, section, question: sectionNode.questions[qIndex - 1].code };
  }
  const sIndex = tabNode.sections.findIndex((s) => s.code === section);
  if (sIndex > 0) {
    const prevSection = tabNode.sections[sIndex - 1];
    return { phase, tab, section: prevSection.code, question: prevSection.questions[prevSection.questions.length - 1].code };
  }
  const tIndex = phaseNode.tabs.findIndex((t) => t.code === tab);
  if (tIndex > 0) {
    const prevTab = phaseNode.tabs[tIndex - 1];
    const prevSection = prevTab.sections[prevTab.sections.length - 1];
    return { phase, tab: prevTab.code, section: prevSection.code, question: prevSection.questions[prevSection.questions.length - 1].code };
  }
  const pIndex = structure.findIndex((p) => p.code === phase);
  if (pIndex > 0) {
    const prevPhase = structure[pIndex - 1];
    const prevTab = prevPhase.tabs[prevPhase.tabs.length - 1];
    const prevSection = prevTab.sections[prevTab.sections.length - 1];
    return { phase: prevPhase.code, tab: prevTab.code, section: prevSection.code, question: prevSection.questions[prevSection.questions.length - 1].code };
  }
  return { phase, tab, section, question };
}

