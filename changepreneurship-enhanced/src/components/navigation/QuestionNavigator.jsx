import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext.jsx';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb.jsx';
import { Button } from '../ui/button.jsx';
import { fromCode, toCode, getNext, getPrev } from '../../lib/navigation.js';

const QuestionNavigator = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { structure, path, navigateTo, markVisited } = useNavigation();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!structure.length) return;
    let target;
    if (params.code) {
      target = fromCode(params.code);
    } else if (params.phase) {
      target = {
        phase: parseInt(params.phase, 10),
        tab: parseInt(params.tab, 10),
        section: parseInt(params.section, 10),
        question: parseInt(params.question, 10),
      };
    }
    navigateTo(target);
  }, [params, structure, navigateTo]);

  useEffect(() => {
    if (!structure.length) return;
    const long = `/phase/${path.phase}/tab/${path.tab}/section/${path.section}/question/${path.question}`;
    navigate(long, { replace: true });
  }, [path, structure, navigate]);

  const phaseNode = structure.find((p) => p.code === path.phase);
  const tabNode = phaseNode?.tabs.find((t) => t.code === path.tab);
  const sectionNode = tabNode?.sections.find((s) => s.code === path.section);
  const questionNode = sectionNode?.questions.find((q) => q.code === path.question);

  useEffect(() => {
    if (questionNode) markVisited(questionNode.id);
  }, [questionNode, markVisited]);

  useEffect(() => {
    if (!sectionNode) return;
    let mounted = true;
    import('../../components/assessment/ComprehensiveQuestionBank.jsx').then(({ SELF_DISCOVERY_QUESTIONS }) => {
      const data = SELF_DISCOVERY_QUESTIONS[sectionNode.id] || [];
      if (mounted) setQuestions(data);
    });
    return () => {
      mounted = false;
    };
  }, [sectionNode]);

  const ITEM_HEIGHT = 60;
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
  const endIndex = Math.min(
    questions.length,
    Math.ceil((scrollTop + 250) / ITEM_HEIGHT) + 5
  );
  const offsetY = startIndex * ITEM_HEIGHT;
  const visible = questions.slice(startIndex, endIndex);

  const nextPhase = getNext(path, structure, 'phase');
  const prevPhase = getPrev(path, structure, 'phase');
  const nextTab = getNext(path, structure, 'tab');
  const prevTab = getPrev(path, structure, 'tab');
  const nextSection = getNext(path, structure, 'section');
  const prevSection = getPrev(path, structure, 'section');
  const nextQuestion = getNext(path, structure, 'question');
  const prevQuestion = getPrev(path, structure, 'question');

  if (!structure.length) return null;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigateTo({ phase: path.phase })}>{phaseNode.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigateTo({ phase: path.phase, tab: path.tab })}>{tabNode.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigateTo({ phase: path.phase, tab: path.tab, section: path.section })}>{sectionNode.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Question {path.question}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="border rounded h-64 overflow-auto" onScroll={onScroll}>
        <Suspense fallback={<div>Loading...</div>}>
          <div style={{ height: questions.length * ITEM_HEIGHT, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visible.map((q) => (
                <div key={q.id} className="p-4 border-b" style={{ height: ITEM_HEIGHT }}>
                  {q.question}
                </div>
              ))}
            </div>
          </div>
        </Suspense>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigateTo(prevPhase)}>
            Prev Phase
          </Button>
          <Button onClick={() => navigateTo(nextPhase)}>Next Phase</Button>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigateTo(prevTab)}>
            Prev Tab
          </Button>
          <Button onClick={() => navigateTo(nextTab)}>Next Tab</Button>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigateTo(prevSection)}>
            Prev Section
          </Button>
          <Button onClick={() => navigateTo(nextSection)}>Next Section</Button>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigateTo(prevQuestion)}>
            Prev Question
          </Button>
          <span>{toCode(path)}</span>
          <Button onClick={() => navigateTo(nextQuestion)}>Next Question</Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
