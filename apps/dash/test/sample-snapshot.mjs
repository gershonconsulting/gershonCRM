// SAMPLE data only (made-up figures) - used by the tests and the preview page.
const g = v => ({ v, tone: 'green' }), a = v => ({ v, tone: 'amber' }), r = v => ({ v, tone: 'red' }), n = v => ({ v, tone: 'grey' });

export const sampleSnapshot = {
  schema: 2,
  week: '2026-W42', start: '2026-10-12', end: '2026-10-18',
  generatedAt: '2026-10-19T06:07:12Z',
  platforms: [
    { id: 'client', name: 'Client CRM', host: 'client.gershoncrm.com', status: 'not_connected', metrics: [] },
    {
      id: 'social', name: 'Social', host: 'social.gershoncrm.com', status: 'connected', sourceNote: 'posts collected Mon–Sun',
      metrics: [
        { label: 'Active clients tracked', value: 31, tone: 'green' },
        { label: 'Posts detected (last week)', value: 9, tone: 'amber', hint: 'Target: 12 or more' },
        { label: 'Tracked clients with no post', value: 11, tone: 'red', hint: 'Fewer is better' },
        { label: 'Connection errors', value: 0, tone: 'green' },
        { label: 'Clients with a tracked account', value: '93.5%', tone: 'green' },
      ],
      table: {
        columns: ['Client', 'Tracked', 'Posts (wk)', 'Last post', 'Type'],
        rows: [
          ['Finance Montréal', g('yes'), g(3), g('2026-10-17'), n('CLIENT')],
          ['Wallix', g('yes'), g(2), g('2026-10-15'), n('CLIENT')],
          ['MAbSilico', g('yes'), g(1), g('2026-10-14'), n('CLIENT')],
          ['Enzymicals AG', g('yes'), r(0), a('2026-10-02'), n('CAMPAIGN')],
          ['Flying Secoya', g('yes'), r(0), a('2026-09-30'), n('CAMPAIGN')],
          ['Amphasys', g('yes'), r(0), r('—'), n('CLIENT')],
        ],
      },
    },
    { id: 'linalysis', name: 'Linalysis', host: 'api.linalysis.net', status: 'not_connected', metrics: [] },
    {
      id: 'finance', name: 'Finance', host: 'finance.gershoncrm.com', status: 'connected', sourceNote: 'Xero, invoices open on Sunday night',
      metrics: [
        { label: 'Unpaid invoices', value: 7, tone: 'amber' },
        { label: 'Overdue > 90 days', value: 1, tone: 'red', hint: 'Should be 0' },
        { label: 'Paid last week', value: null },
      ],
    },
    { id: 'nexashare', name: 'NexaShare', host: 'nexashare.com', status: 'unreachable', metrics: [] },
  ],
};

export const sampleWeeks = [
  { week: '2026-W42', range: '12 – 18 Oct 2026' },
  { week: '2026-W41', range: '5 – 11 Oct 2026' },
  { week: '2026-W40', range: '28 Sept – 4 Oct 2026' },
  { week: '2026-W35', range: '24 – 30 Aug 2026' },
];
