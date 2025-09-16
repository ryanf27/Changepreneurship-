export async function getNavigationStructure() {
  const { SELF_DISCOVERY_QUESTIONS } = await import('../components/assessment/ComprehensiveQuestionBank.jsx');
  const sections = Object.keys(SELF_DISCOVERY_QUESTIONS).map((key, idx) => ({
    id: key,
    code: idx + 1,
    order: idx + 1,
    title: key,
    questions: SELF_DISCOVERY_QUESTIONS[key].map((q, qIdx) => ({
      id: q.id,
      code: qIdx + 1,
      order: qIdx + 1,
    })),
  }));
  return [
    {
      id: 'self_discovery',
      code: 1,
      order: 1,
      title: 'Self Discovery',
      tabs: [
        {
          id: 'assessment',
          code: 1,
          order: 1,
          title: 'Assessment',
          sections,
        },
      ],
    },
  ];
}
